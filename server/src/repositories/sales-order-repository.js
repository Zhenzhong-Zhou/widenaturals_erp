const { withTransaction, query, getStatusValue } = require('../database/db');
const { createOrder, updateOrderData } = require('./order-repository');
const AppError = require('../utils/AppError');
const { addOrderItems } = require('./order-item-repository');
const { getValidDiscountById } = require('./discount-repository');
const { getActiveTaxRateById, checkTaxRateExists } = require('./tax-rate-repository');
const { getActiveProductPrice } = require('./pricing-repository');
const { logError } = require('../utils/logger-helper');
const { checkDeliveryMethodExists } = require('./delivery-method-repository');
const { checkCustomerExistsById } = require('./customer-repository');

/**
 * Creates a sales order in the `sales_orders` table using raw SQL.
 * Uses the provided transaction client instead of the global query().
 *
 * @param {Object} salesOrderData - Sales order details.
 * @returns {Promise<Object>} - The created sales order.
 */
const createSalesOrder = async (salesOrderData) => {
  return withTransaction(async (client) => {
    try {
      const status_id = await getStatusValue({
        table: 'order_status',
        where: { code: 'ORDER_PENDING' },
        select: 'id',
      }, client);
      
      // Validate customer ID
      const customerExists = await checkCustomerExistsById(salesOrderData.customer_id, client);
      if (!customerExists) {
        throw AppError.validationError('Invalid or non-existent customer provided.');
      }
      
      // Validate delivery method ID if provided
      if (salesOrderData.delivery_method_id) {
        const deliveryMethodExists = await checkDeliveryMethodExists(
          salesOrderData.delivery_method_id,
          client
        );
        if (!deliveryMethodExists) {
          throw AppError.validationError(
            'Invalid or non-existent delivery method provided.'
          );
        }
      }
      
      // Validate tax rate ID if provided
      if (salesOrderData.tax_rate_id) {
        const taxRateExists = await checkTaxRateExists(
          salesOrderData.tax_rate_id,
          client
        );
        if (!taxRateExists) {
          throw AppError.validationError('Invalid tax rate provided.');
        }
      }
      
      // Destructure shipping info safely
      const {
        has_shipping_info = false,
        shipping_info = {},
        items
      } = salesOrderData;
      
      const {
        shipping_fullname,
        shipping_phone,
        shipping_email,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        shipping_region,
      } = shipping_info;
      
      // Step 1: Create a general order in the `orders` table
      const order = await createOrder({
        order_type_id: salesOrderData.order_type_id,
        order_date: salesOrderData.order_date,
        order_status_id: status_id,
        has_shipping_address: has_shipping_info,
        shipping_fullname,
        shipping_phone,
        shipping_email,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        shipping_region,
        metadata: salesOrderData.metadata,
        note: salesOrderData.note,
        created_by: salesOrderData.created_by,
        updated_by: salesOrderData.updated_by,
      });

      // Step 2: Fetch Prices & Calculate Subtotal
      let subtotal = 0;
      const processedItems = [];
      const manualPriceOverrides = [];

      for (const item of items) {
        const { product_id, price_type_id, price, quantity_ordered } = item;
        
        // Fetch product price including location-based pricing
        const productPrice = await getActiveProductPrice(
          product_id,
          price_type_id,
          client
        );
        
        if (!productPrice) {
          throw AppError.validationError(
            `No active price found for product ${product_id} at the given location.`
          );
        }
        
        // Convert database price to Number if necessary
        const dbPrice = parseFloat(productPrice.price);
        
        // Check if input price matches the database price or is null
        const is_manual_price =
          price !== null &&
          price !== undefined &&
          !isNaN(price) &&
          price > 0 &&
          price !== dbPrice; // Compare using dbPrice as Number
        
        // Use input price if provided and different from DB, otherwise use DB price
        const final_price = price === 0 ? dbPrice : is_manual_price ? price : dbPrice;
        
        // Compute item total and add to subtotal
        const itemTotal = final_price * quantity_ordered;
        subtotal += itemTotal;
        
        // Store price_id from pricing table for tracking
        processedItems.push({
          ...item,
          price_id: productPrice.id,
          price: final_price,
          status_id,
        });
        
        // Track manual price overrides
        if (is_manual_price) {
          manualPriceOverrides.push({
            product_id,
            price_type_id,
            original_price: dbPrice,
            overridden_price: final_price,
            reason: 'Price Overridden',
          });
        }
      }
      
      // Step 3: Fetch discount details (if discount ID is provided)
      let discountAmount = 0;
      if (salesOrderData.discount_id) {
        const discount = await getValidDiscountById(salesOrderData.discount_id, client);
        
        if (!discount) {
          throw AppError.validationError('Invalid or expired discount provided.');
        }
        
        // Correctly calculate discount amount
        discountAmount =
          discount.discount_type === 'PERCENTAGE'
            ? (subtotal * discount.discount_value) / 100
            : discount.discount_value;
        
        // Prevent discount from exceeding the subtotal
        discountAmount = Math.min(discountAmount, subtotal);
      }

      // Step 4: Fetch Tax Rate
      const taxRate = salesOrderData.tax_rate_id
        ? await getActiveTaxRateById(salesOrderData.tax_rate_id, client)
        : 0;

      // Step 5: Calculate Tax & Final Total
      const taxableAmount = Math.max(subtotal - discountAmount, 0); // Ensure it never goes below 0
      
      const taxAmount = taxableAmount * (taxRate / 100);
      
      const finalTotal = taxableAmount + taxAmount;
      
      // Step 6: Create the sales order using the same order ID
      const salesOrderSql = `
        INSERT INTO sales_orders (
          id, customer_id, order_date, discount_id, discount_amount, subtotal,
          tax_rate_id, tax_amount, delivery_method_id, total_amount, created_by,
          updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id;
      `;

      const salesOrderValues = [
        order.id, // Use the same order ID
        salesOrderData.customer_id,
        salesOrderData.order_date,
        salesOrderData.discount_id || null,
        discountAmount, // Store actual discount value applied
        subtotal, // Store calculated subtotal
        salesOrderData.tax_rate_id || null,
        taxAmount, // Store calculated tax amount
        salesOrderData.delivery_method_id || null,
        finalTotal, // Store final total after discount and tax
        salesOrderData.created_by,
        null,
        null,
      ];

      const salesOrderResult = await client.query(
        salesOrderSql,
        salesOrderValues
      );
      const salesOrder = salesOrderResult.rows[0];

      // Step 7: Ensure order items exist
      if (!processedItems.length) {
        throw AppError.validationError(
          'Sales order must have at least one item.'
        );
      }

      // Step 8: Add order items using transaction client
      await addOrderItems(
        order.id,
        processedItems,
        salesOrderData.created_by,
        client
      );
      
      // Step 9: If manual price overrides exist, update order metadata
      if (manualPriceOverrides.length > 0) {
        await updateOrderData(order.id, { manual_price_overrides: manualPriceOverrides, updated_by: salesOrderData.created_by }, client);
      }
      
      return { order, salesOrder };
    } catch (error) {
      logError('Sales Order Creation Error:', error);
      throw AppError.databaseError(
        `Failed to create sales order: ${error.message}`
      );
    }
  });
};

module.exports = {
  createSalesOrder,
};
