/**
 * @file sales-order-business.js
 * @description Domain business logic for sales order creation, including ID
 * validation, item pipeline orchestration, pricing, discount, tax calculation,
 * and order metadata construction.
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  validateIdExists,
  validateIdsExist,
} = require('../validators/entity-id-validators');
const { uniqUuids } = require('../utils/array-utils');
const {
  enrichOrderItemsWithResolvedPrice,
  dedupeOrderItems,
  assertPositiveQuantities,
  assertNotPackagingOnly,
} = require('./order-item-business');
const { getDiscountById }          = require('../repositories/discount-repository');
const { calculateDiscountAmount }  = require('./discount-business');
const { getTaxRateById }           = require('../repositories/tax-rate-repository');
const { calculateTaxableAmount }   = require('./tax-rate-business');
const { insertSalesOrder }         = require('../repositories/sales-order-repository');
const {
  insertOrderItemsBulk,
} = require('../repositories/order-item-repository');
const { validateAndAssignAddressOwnership } = require('./address-business');
const {
  getPaymentStatusIdByCode,
} = require('../repositories/payment-status-repository');

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Validates that all referenced IDs in a sales order payload exist in the
 * database.
 *
 * Validates top-level IDs individually and batches per-line item FK checks
 * into parallel queries for efficiency.
 *
 * @param {object} orderData - Sales order payload.
 * @param {import('pg').PoolClient} client - Active transaction client.
 * @returns {Promise<void>}
 * @throws {AppError} validationError if any ID is missing or line items are malformed.
 */
const validateSalesOrderIds = async (orderData, client) => {
  const {
    customer_id,
    payment_method_id,
    delivery_method_id,
    order_items = [],
  } = orderData;
  
  // Top-level IDs — validated individually since the set is small.
  for (const [id, table, label] of [
    [customer_id,        'customers',        'Customer'],
    [payment_method_id,  'payment_methods',  'Payment Method'],
    [delivery_method_id, 'delivery_methods', 'Delivery Method'],
  ]) {
    if (id != null) await validateIdExists(table, id, client, label);
  }
  
  // Each line item must have exactly one of sku_id or packaging_material_id.
  for (let i = 0; i < order_items.length; i++) {
    const it     = order_items[i];
    const hasSku = !!it.sku_id;
    const hasPkg = !!it.packaging_material_id;
    
    if ((hasSku && hasPkg) || (!hasSku && !hasPkg)) {
      throw AppError.validationError(
        `Item #${i + 1}: exactly one of sku_id or packaging_material_id is required.`
      );
    }
  }
  
  // Batch FK checks — deduplicated per type, run in parallel.
  const skuIds    = uniqUuids(order_items.map((i) => i.sku_id));
  const pkgIds    = uniqUuids(order_items.map((i) => i.packaging_material_id));
  const statusIds = uniqUuids(order_items.map((i) => i.status_id));
  const priceIds  = uniqUuids(order_items.map((i) => i.price_id));
  
  await Promise.all([
    validateIdsExist(client, 'skus',               skuIds,    { label: 'SKU' }),
    validateIdsExist(client, 'packaging_materials', pkgIds,    { label: 'Packaging' }),
    validateIdsExist(client, 'order_status',        statusIds, { label: 'Order item status' }),
    validateIdsExist(client, 'pricing',             priceIds,  { label: 'Price' }),
  ]);
};

/**
 * Builds order-level metadata from enriched order items.
 *
 * Captures a price override summary when any line item has a manually
 * overridden price.
 *
 * @param {object[]} enrichedItems - Enriched order item records.
 * @returns {object} Order metadata object, empty if no overrides exist.
 */
const buildOrderMetadata = (enrichedItems) => {
  const overrides = enrichedItems
    .filter((i) => i.metadata?.reason === 'manual override')
    .map((i) => ({
      sku_id:          i.sku_id,
      reason:          i.metadata.reason,
      submitted_price: i.metadata.submitted_price,
      db_price:        i.metadata.db_price,
      ...(i.metadata.conflictNote && {
        data:      i.metadata.conflictNote.data,
        timestamp: i.metadata.conflictNote.timestamp,
      }),
    }));
  
  return overrides.length > 0
    ? {
      price_override_summary: {
        has_override:   true,
        override_count: overrides.length,
        overrides,
        generated_at:   new Date().toISOString(),
      },
    }
    : {};
};

// ---------------------------------------------------------------------------
// Exported business functions
// ---------------------------------------------------------------------------

/**
 * Creates a sales order with full item pipeline orchestration.
 *
 * Pipeline steps:
 *   1. Guard against empty item list and missing addresses.
 *   2. Validate address ownership (assigns orphan addresses to the customer).
 *   3. Deduplicate order items.
 *   4. Apply business rules (positive quantities, at least one SKU line).
 *   5. Validate all referenced IDs exist.
 *   6. Enrich items with resolved prices and compute subtotal.
 *   7. Build order metadata from enriched items.
 *   8. Apply discount if provided.
 *   9. Apply tax if provided.
 *  10. Compute final totals.
 *  11. Resolve default payment status.
 *  12. Persist order header and line items.
 *
 * @param {InsertSalesOrderPayload} orderData - Sales order creation payload.
 * @param {PoolClient} client - Active transaction client.
 * @returns {Promise<object>} Created sales order record.
 * @throws {AppError} validationError for missing/invalid fields or IDs.
 * @throws {AppError} notFoundError if referenced entities do not exist.
 */
const createSalesOrder = async (orderData, client) => {
  const {
    id: order_id,
    customer_id,
    shipping_address_id,
    billing_address_id,
    order_items = [],
    discount_id,
    tax_rate_id,
    shipping_fee   = 0,
    exchange_rate  = null,
    currency_code  = 'CAD',
    status_id,
    ...salesData
  } = orderData;
  
  // 1. Guard against empty orders and missing addresses.
  if (!Array.isArray(order_items) || order_items.length === 0) {
    throw AppError.validationError(
      'Sales order must include at least one item.'
    );
  }
  if (!shipping_address_id) {
    throw AppError.validationError('Shipping address is required.');
  }
  if (!billing_address_id) {
    throw AppError.validationError('Billing address is required.');
  }
  
  // 2. Validate address ownership — assigns orphan addresses to the customer.
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
  
  // 3. Deduplicate before downstream validation to reduce query load.
  const dedupedItems = dedupeOrderItems(order_items);
  
  // 4. Business rule validation.
  assertPositiveQuantities(dedupedItems);
  assertNotPackagingOnly(dedupedItems);
  
  // 5. FK validation on deduped set.
  await validateSalesOrderIds(
    { ...orderData, order_items: dedupedItems },
    client
  );
  
  // 6. Enrich items with resolved prices and compute subtotal.
  const { enrichedItems, subtotal } = await enrichOrderItemsWithResolvedPrice(
    dedupedItems,
    client
  );
  
  // 7. Build order metadata from enriched items.
  const orderMetadata = buildOrderMetadata(enrichedItems);
  
  // 8. Apply discount.
  let discountAmount = 0;
  if (discount_id) {
    const discount = await getDiscountById(discount_id, client);
    if (!discount) {
      throw AppError.validationError(`Invalid discount_id: ${discount_id}`);
    }
    discountAmount = calculateDiscountAmount(subtotal, discount);
  }
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  
  // 9. Apply tax.
  let taxAmount = 0;
  if (tax_rate_id) {
    const taxRate = await getTaxRateById(tax_rate_id, client);
    if (!taxRate) {
      throw AppError.validationError(`Invalid tax_rate_id: ${tax_rate_id}`);
    }
    const { taxAmount: ta } = calculateTaxableAmount(
      subtotal,
      discountAmount,
      taxRate
    );
    taxAmount = ta;
  }
  
  // 10. Compute final totals.
  const totalAmount        = discountedSubtotal + taxAmount + shipping_fee;
  const baseCurrencyAmount = exchange_rate
    ? Math.round(totalAmount * exchange_rate * 100) / 100
    : null;
  
  // 11. Resolve default payment status.
  const paymentStatus = await getPaymentStatusIdByCode('UNPAID', client);
  if (!paymentStatus) {
    throw AppError.validationError('Missing default payment status: UNPAID');
  }
  
  // 12. Persist order header.
  const salesOrder = await insertSalesOrder(
    {
      ...salesData,
      id:                   order_id,
      customer_id,
      currency_code,
      exchange_rate,
      base_currency_amount: baseCurrencyAmount,
      discount_id,
      discount_amount:      discountAmount,
      subtotal,
      tax_rate_id,
      tax_amount:           taxAmount,
      shipping_fee,
      total_amount:         totalAmount,
      metadata:             orderMetadata,
      payment_status_id:    paymentStatus,
    },
    client
  );
  
  // Persist line items with the order's initial status.
  if (dedupedItems.length > 0) {
    await insertOrderItemsBulk(
      order_id,
      enrichedItems.map((item) => ({ ...item, status_id })),
      client
    );
  }
  
  return salesOrder;
};

module.exports = {
  createSalesOrder,
};
