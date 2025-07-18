const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { validateIdExists } = require('../validators/entity-id-validators');
const { enrichOrderItemsWithResolvedPrice } = require('./order-item-business');
const { getDiscountById } = require('../repositories/discount-repository');
const { calculateDiscountAmount } = require('./discount-business');
const { getTaxRateById } = require('../repositories/tax-rate-repository');
const { calculateTaxableAmount } = require('./tax-rate-business');
const { insertSalesOrder } = require('../repositories/sales-order-repository');
const {
  insertOrderItemsBulk,
} = require('../repositories/order-item-repository');
const { validateAndAssignAddressOwnership } = require('./address-business');
const {
  getPaymentStatusIdByCode,
} = require('../repositories/payment-status-repository');

/**
 * Validates the existence of foreign key IDs in a sales order payload.
 *
 * This function checks both top-level order IDs (e.g., customer_id, tax_rate_id)
 * and all related IDs inside each order item (e.g., product_id, price_id).
 *
 * @param {object} orderData - The full sales order payload.
 * @param {PoolClient} client - DB client used for transaction-safe validation.
 * @returns {Promise<void>} - Resolves if all IDs exist; throws if any are invalid.
 * @throws {AppError} - If any ID does not exist or a database error occurs.
 */
const validateSalesOrderIds = async (orderData, client) => {
  try {
    const {
      customer_id,
      payment_method_id,
      delivery_method_id,
      order_items = [],
    } = orderData;

    const validations = [
      [customer_id, 'customers'],
      [payment_method_id, 'payment_methods'],
      [delivery_method_id, 'delivery_methods'],
    ];

    // Validate top-level IDs
    for (const [id, table] of validations) {
      if (id != null) {
        await validateIdExists(table, id, client);
      }
    }

    // Validate each order item's IDs
    for (const item of order_items) {
      const { product_id, packaging_material_id, price_id, status_id } = item;

      const itemValidations = [
        [product_id, 'products'],
        [packaging_material_id, 'packaging_materials'],
        [price_id, 'pricing'],
        [status_id, 'order_status'],
      ];

      for (const [id, table] of itemValidations) {
        if (id != null) {
          await validateIdExists(table, id, client);
        }
      }
    }
  } catch (error) {
    logSystemException(error, 'Sales order ID validation failed', {
      context: 'sales-order-business/validateSalesOrderIds',
      orderData,
    });
    throw AppError.validationError(
      'One or more referenced IDs are invalid or missing.'
    );
  }
};

/**
 * Builds order-level metadata summarizing price overrides.
 *
 * Scans enriched order items and collects details about any items
 * where a manual price override occurred (i.e., final price ≠ DB price).
 *
 * Example return:
 * {
 *   price_override_summary: {
 *     has_override: true,
 *     overrides: [
 *       { sku_id: 'abc', submitted_price: 22, db_price: 20 },
 *       ...
 *     ]
 *   }
 * }
 *
 * @param {Array<object>} enrichedItems - List of enriched order items (each may contain meta)
 * @returns {object} - Order metadata object for insertion into the order table
 */
const buildOrderMetadata = (enrichedItems) => {
  const overrides = enrichedItems
    .filter((i) => i.metadata && i.metadata.reason === 'manual override')
    .map((i) => ({
      sku_id: i.sku_id,
      submitted_price: i.metadata.submitted_price,
      db_price: i.metadata.db_price,
    }));

  return {
    price_override_summary: {
      has_override: overrides.length > 0,
      override_count: overrides.length,
      overrides,
      generated_at: new Date().toISOString(),
    },
  };
};

/**
 * Creates a sales order with calculated totals and associated order item inserts.
 *
 * This function handles business-layer validations including
 * - Ensuring the presence of at least one order item
 * - Enforcing the presence of shipping and billing addresses
 * - Verifying address ownership against the customer
 * - Validating all referenced foreign keys (products, pricing, etc.)
 * - Applying discounts, taxes, and calculating totals
 *
 * @param {object} orderData - Full sales order input payload including items, addresses, and pricing data.
 * @param {PoolClient} client - PostgreSQL client within an open transaction.
 *
 * @returns {Promise<object>} The inserted sales order record.
 *
 * @throws {AppError} If validation fails or insertion errors occur. Specific errors include:
 * - Missing order items
 * - Missing shipping or billing address
 * - Address ownership mismatch
 * - Invalid foreign key references (product, customer, tax rate, etc.)
 */
const createSalesOrder = async (orderData, client) => {
  try {
    const {
      id: order_id,
      customer_id,
      shipping_address_id,
      billing_address_id,
      order_items = [],
      discount_id,
      tax_rate_id,
      shipping_fee = 0,
      exchange_rate = null,
      currency_code = 'CAD',
      status_id,
      ...salesData
    } = orderData;

    // Ensure the order includes at least one item.
    // Prevents creating empty sales orders that would break downstream logic.
    if (!Array.isArray(order_items) || order_items.length === 0) {
      logSystemException(
        new Error('Empty order_items'),
        'Missing order items for sales order',
        {
          context: 'sales-order-business/createSalesOrder',
          order_id,
          order_items,
          created_by: orderData.created_by,
        }
      );
      throw AppError.validationError(
        'Sales order must include at least one item.'
      );
    }

    // Ensure shipping address is provided (required for fulfillment).
    // This is enforced in the business layer, even if the DB allows nulls for drafts.
    if (!shipping_address_id) {
      throw AppError.validationError('Shipping address is required.');
    }

    // Ensure billing address is provided (required for invoicing and tax compliance).
    if (!billing_address_id) {
      throw AppError.validationError('Billing address is required.');
    }

    // Validate that each address belongs to the given customer.
    // Assigns the customer to the address if it's unclaimed.
    await validateAndAssignAddressOwnership(
      shipping_address_id,
      customer_id,
      client
    );
    await validateAndAssignAddressOwnership(
      billing_address_id,
      customer_id,
      client
    );

    // Step 1: Validate all IDs
    await validateSalesOrderIds(orderData, client);

    // Step 2: Calculate item subtotals
    const { enrichedItems, subtotal } = await enrichOrderItemsWithResolvedPrice(
      order_items,
      client
    );

    // Step 2b: Build order-level metadata
    const orderMetadata = buildOrderMetadata(enrichedItems);

    // Step 3: Apply discount
    let discountAmount = 0;
    if (discount_id) {
      const discount = await getDiscountById(discount_id, client);
      if (!discount) {
        throw AppError.validationError(`Invalid discount_id: ${discount_id}`);
      }
      discountAmount = calculateDiscountAmount(subtotal, discount);
    }

    const discountedSubtotal = Math.max(subtotal - discountAmount, 0);

    // Step 4: Calculate tax
    let taxAmount = 0;
    if (tax_rate_id) {
      const taxRate = await getTaxRateById(tax_rate_id, client);
      if (!taxRate) {
        throw AppError.validationError(`Invalid tax_rate_id: ${tax_rate_id}`);
      }
      const result = calculateTaxableAmount(subtotal, discountAmount, taxRate);
      taxAmount = result.taxAmount;
    }

    // Step 5: Total
    const totalAmount = discountedSubtotal + taxAmount + shipping_fee;

    // Step 6: Base currency
    const baseCurrencyAmount = exchange_rate
      ? Math.round(totalAmount * exchange_rate * 100) / 100
      : null;

    // Step 7a: Get default payment status ID (e.g., 'unpaid')
    const paymentStatus = await getPaymentStatusIdByCode('UNPAID', client); // or your actual function & code
    if (!paymentStatus) {
      throw AppError.validationError('Missing default payment status: UNPAID');
    }
    const payment_status_id = paymentStatus.id;

    // Step 7: Insert sales order
    const salesOrder = await insertSalesOrder(
      {
        ...salesData,
        id: order_id,
        customer_id,
        currency_code,
        exchange_rate,
        base_currency_amount: baseCurrencyAmount,
        discount_id,
        discount_amount: discountAmount,
        subtotal,
        tax_rate_id,
        tax_amount: taxAmount,
        shipping_fee,
        total_amount: totalAmount,
        metadata: orderMetadata,
        payment_status_id,
      },
      client
    );

    // Step 8: Insert order items
    if (Array.isArray(order_items) && order_items.length > 0) {
      const enrichedItemsWithStatus = enrichedItems.map((item) => ({
        ...item,
        status_id,
      }));

      await insertOrderItemsBulk(order_id, enrichedItemsWithStatus, client);
    }

    return salesOrder;
  } catch (error) {
    logSystemException(error, 'Failed to create sales order', {
      context: 'sales-order-business/createSalesOrder',
      orderData,
    });
    throw AppError.businessError('Unable to create sales order.');
  }
};

module.exports = {
  createSalesOrder,
};
