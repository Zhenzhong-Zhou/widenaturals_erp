const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { validateIdExists, validateIdsExist } = require('../validators/entity-id-validators');
const {
  enrichOrderItemsWithResolvedPrice,
  dedupeOrderItems,
  assertPositiveQuantities,
  assertNotPackagingOnly
} = require('./order-item-business');
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
 * Validate IDs on a sales-order payload (runs on the *deduped* items set).
 *
 * Validations:
 * 1) Top-level FKs (if provided): customer_id, payment_method_id, delivery_method_id
 * 2) Per-line XOR: exactly one of sku_id or packaging_material_id
 * 3) Batch FK existence for line sets (each set runs only if non-empty):
 *    - skus, packaging_materials, order_status, pricing
 * 4) (Optional) Add a batch check that (price_id) belongs to (sku_id)
 *
 * Notes:
 * - Expects `order_items` to be pre-deduped.
 * - Business rules like “packaging-only not allowed” live in the sales-order business layer.
 *
 * @param {object} orderData
 * @param {import('pg').PoolClient} client
 * @returns {Promise<void>}
 * @throws {AppError} validationError | businessError
 */
const validateSalesOrderIds = async (orderData, client) => {
  try {
    const { customer_id, payment_method_id, delivery_method_id, order_items = [] } = orderData;
    
    // 1) Top-level: small set → fine to validate one-by-one
    for (const [id, table, label] of [
      [customer_id, 'customers', 'Customer'],
      [payment_method_id, 'payment_methods', 'Payment Method'],
      [delivery_method_id, 'delivery_methods', 'Delivery Method'],
    ]) {
      if (id != null) await validateIdExists(table, id, client, label);
    }
    
    // 2) Per-line XOR (keep index for a precise error)
    for (let i = 0; i < order_items.length; i++) {
      const it = order_items[i];
      const hasSku = !!it.sku_id;
      const hasPkg = !!it.packaging_material_id;
      if ((hasSku && hasPkg) || (!hasSku && !hasPkg)) {
        throw AppError.validationError(
          `Item #${i + 1}: exactly one of sku_id or packaging_material_id is required.`
        );
      }
    }
    
    // 3) Batch FK checks (0..4 queries depending on non-empty sets)
    const idsOf = (items, key) =>
      [...new Set(items.map(i => i[key]).filter(Boolean).map(s => String(s).trim().toLowerCase()))];
    
    const skuIds    = idsOf(order_items, 'sku_id');
    const pkgIds    = idsOf(order_items, 'packaging_material_id');
    const statusIds = idsOf(order_items, 'status_id');
    const priceIds  = idsOf(order_items, 'price_id');
    
    await Promise.all([
      validateIdsExist(client, 'skus', skuIds, { label: 'SKU' }),
      validateIdsExist(client, 'packaging_materials', pkgIds, { label: 'Packaging' }),
      validateIdsExist(client, 'order_status', statusIds, { label: 'Order item status' }),
      validateIdsExist(client, 'pricing', priceIds, { label: 'Price' }),
    ]);
  } catch (error) {
    // Preserve domain errors; wrap unknowns
    if (error instanceof AppError) throw error;
    throw AppError.businessError('ID validation failed', { cause: error });
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
    .filter((i) => i.metadata?.reason === 'manual override')
    .map((i) => ({
      sku_id: i.sku_id,
      reason: i.metadata.reason,
      submitted_price: i.metadata.submitted_price,
      db_price: i.metadata.db_price,
      ...(i.metadata.conflictNote && {
        data: i.metadata.conflictNote.data,
        timestamp: i.metadata.conflictNote.timestamp,
      }),
    }));
  
  return {
    ...(overrides.length > 0 && {
      price_override_summary: {
        has_override: true,
        override_count: overrides.length,
        overrides,
        generated_at: new Date().toISOString(),
      },
    }),
  };
};

/**
 * Creates a Sales Order (type-specific) and its line items with calculated totals.
 *
 * Pipeline:
 * 1) Basic guards (non-empty items, required addresses)
 * 2) Address → customer ownership verification (and assignment if unclaimed)
 * 3) Dedupe items (by SKU/packaging + price identity) to avoid duplicate lines
 * 4) Business rules (assert qty > 0, forbid packaging-only, etc.)
 * 5) Foreign-key validation on the *deduped* set (SKUs, pricing, etc.)
 * 6) Enrich items with resolved price (catalog price_id or override)
 * 7) Build order metadata from enriched items
 * 8) Apply discount → compute discounted subtotal
 * 9) Apply tax on discounted subtotal
 * 10) Compute totals (subtotal/discount/tax/shipping/base currency)
 * 11) Determine default payment status (e.g., UNPAID)
 * 12) Insert sales order (type-specific header) and bulk-insert items
 *
 * Notes:
 * - Business-layer validations are enforced here even if DB allows drafts/nulls.
 * - This function assumes the base order record already exists and `order_id` is provided.
 * - Keep dedupe generic/pure; keep sales-specific rules in this business layer.
 *
 * @param {object} orderData - Full sales order payload (header + items).
 * @param {import('pg').PoolClient} client - PG client within an open transaction.
 * @returns {Promise<object>} Inserted sales order record.
 * @throws {AppError} on validation or insertion errors.
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
    
    // --- Guards: prevent empty orders and missing addresses early ---
    if (!Array.isArray(order_items) || order_items.length === 0) {
      logSystemException(new Error('Empty order_items'), 'Missing order items for sales order', {
        context: 'sales-order-business/createSalesOrder',
        order_id,
        order_items,
        created_by: orderData.created_by,
      });
      throw AppError.validationError('Sales order must include at least one item.');
    }
    if (!shipping_address_id) throw AppError.validationError('Shipping address is required.');
    if (!billing_address_id) throw AppError.validationError('Billing address is required.');
    
    // --- Address ownership checks (and assignment if unclaimed) ---
    await validateAndAssignAddressOwnership(shipping_address_id, customer_id, client);
    await validateAndAssignAddressOwnership(billing_address_id, customer_id, client);
    
    // --- Items pipeline ---
    // 1) Dedupe first: reduces later validation/price lookups and fixes totals
    const dedupedItems = dedupeOrderItems(order_items);
    
    // 2) Business rules (sales-specific)
    assertPositiveQuantities(dedupedItems);   // defense-in-depth (also have Joi + DB CHECK)
    assertNotPackagingOnly(dedupedItems);     // must contain at least one SKU line
    
    // 3) FK validation on the deduped set (IDs exist, XOR, etc.)
    await validateSalesOrderIds({ ...orderData, order_items: dedupedItems }, client);
    
    // 4) Enrich (resolve price & per-line subtotal)
    const { enrichedItems, subtotal } = await enrichOrderItemsWithResolvedPrice(dedupedItems, client);
    
    // 5) Metadata derived from final line set
    const orderMetadata = buildOrderMetadata(enrichedItems);
    
    // 6) Discount
    let discountAmount = 0;
    if (discount_id) {
      const discount = await getDiscountById(discount_id, client);
      if (!discount) throw AppError.validationError(`Invalid discount_id: ${discount_id}`);
      discountAmount = calculateDiscountAmount(subtotal, discount);
    }
    const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
    
    // 7) Tax
    let taxAmount = 0;
    if (tax_rate_id) {
      const taxRate = await getTaxRateById(tax_rate_id, client);
      if (!taxRate) throw AppError.validationError(`Invalid tax_rate_id: ${tax_rate_id}`);
      const { taxAmount: ta } = calculateTaxableAmount(subtotal, discountAmount, taxRate);
      taxAmount = ta;
    }
    
    // 8) Totals
    const totalAmount = discountedSubtotal + taxAmount + shipping_fee;
    const baseCurrencyAmount = exchange_rate
      ? Math.round(totalAmount * exchange_rate * 100) / 100
      : null;
    
    // 9) Default payment status
    const paymentStatus = await getPaymentStatusIdByCode('UNPAID', client);
    if (!paymentStatus) throw AppError.validationError('Missing default payment status: UNPAID');
    const payment_status_id = paymentStatus;
    
    // --- Persist header (type-specific) ---
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
    
    // --- Persist items (carry initial status to lines if applicable) ---
    if (dedupedItems.length > 0) {
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
