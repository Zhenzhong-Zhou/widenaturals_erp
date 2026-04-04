/**
 * @file order-item-business.js
 * @description Domain business logic for order item deduplication, validation,
 * price enrichment, and subtotal calculation.
 */

'use strict';

const {
  getPricesByIdAndSkuBatch,
} = require('../repositories/pricing-repository');
const AppError              = require('../utils/AppError');
const { resolveFinalPrice } = require('./pricing-business');
const { deduplicatePairs }  = require('../utils/array-utils');

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Builds a stable deduplication key for an order item.
 *
 * Key shape: `kind|primaryId|priceIdentity[|extraField:value...]`
 *
 * Price identity prefers `price_id` over `override_price`. A placeholder is
 * used when neither is present to keep the key shape stable.
 *
 * @param {object} item - Order item object.
 * @param {object} [opts={}]
 * @param {string[]} [opts.extraFields=[]] - Additional fields to include in the key.
 * @returns {string} Composite deduplication key.
 */
const buildDedupeKey = (item, opts = {}) => {
  const { extraFields = [] } = opts;
  
  const isSku = !!item.sku_id;
  const isPkg = !!item.packaging_material_id;
  const kind  = isSku ? 'sku' : isPkg ? 'pkg' : 'unknown';
  
  const parts = [kind];
  
  if (isSku) parts.push(item.sku_id);
  if (isPkg) parts.push(item.packaging_material_id);
  
  if (item.price_id != null) {
    parts.push(`price:${item.price_id}`);
  } else if (item.override_price != null) {
    parts.push(`ovr:${item.override_price}`);
  } else {
    // Placeholder keeps key shape stable when no price identity is present.
    parts.push('price:');
  }
  
  for (const f of extraFields) {
    parts.push(`${f}:${item[f] ?? ''}`);
  }
  
  return parts.join('|');
};

// ---------------------------------------------------------------------------
// Exported business functions
// ---------------------------------------------------------------------------

/**
 * Deduplicates order items by composite key, accumulating quantities for
 * matching items.
 *
 * @param {object[]} [items=[]] - Raw order item array.
 * @param {object} [opts={}] - Options passed to `buildDedupeKey`.
 * @param {string[]} [opts.extraFields=[]] - Additional fields to include in the key.
 * @returns {object[]} Deduplicated order items with accumulated quantities.
 */
const dedupeOrderItems = (items, opts = {}) => {
  const map = new Map();
  
  for (const it of items ?? []) {
    const key  = buildDedupeKey(it, opts);
    const prev = map.get(key);
    
    if (prev) {
      const prevQty = Number(prev.quantity_ordered) || 0;
      const addQty  = Number(it.quantity_ordered)   || 0;
      map.set(key, { ...prev, quantity_ordered: prevQty + addQty });
    } else {
      map.set(key, { ...it });
    }
  }
  
  return Array.from(map.values());
};

/**
 * Asserts that all order items have a positive `quantity_ordered`.
 *
 * @param {object[]} items - Order item array.
 * @returns {void}
 * @throws {AppError} validationError if any item has a non-positive quantity.
 */
const assertPositiveQuantities = (items) => {
  for (let i = 0; i < items.length; i++) {
    if (!(Number(items[i].quantity_ordered) > 0)) {
      throw AppError.validationError(`Item #${i + 1}: quantity must be > 0`);
    }
  }
};

/**
 * Asserts that the order contains at least one SKU line item.
 *
 * Sales orders must not consist exclusively of packaging material lines.
 *
 * @param {object[]} items - Order item array.
 * @returns {void}
 * @throws {AppError} validationError if no SKU line items are present.
 */
const assertNotPackagingOnly = (items) => {
  if (!items.some((it) => !!it.sku_id)) {
    throw AppError.validationError(
      'Sales order must include at least one product (SKU) item; packaging-only is not allowed.'
    );
  }
};

/**
 * Enriches order items with resolved prices and computes the order subtotal.
 *
 * SKU lines: fetches catalog prices in a single batch query, then resolves
 * the final price per line (allowing manual override via `resolveFinalPrice`).
 * Packaging lines: always priced at zero.
 *
 * Attaches `price`, `subtotal`, and optionally `metadata` (for manual
 * overrides) to each enriched item.
 *
 * @param {object[]} orderItems - Deduplicated order item array.
 * @param {import('pg').PoolClient} client - Active transaction client.
 * @returns {Promise<{ enrichedItems: object[], subtotal: number }>}
 * @throws {AppError} validationError if a price_id/sku_id pair is not found.
 */
const enrichOrderItemsWithResolvedPrice = async (orderItems, client) => {
  // Collect unique (price_id, sku_id) pairs for SKU lines — single batch query.
  const pairs = deduplicatePairs(
    orderItems
      .filter((it) => it.sku_id && it.price_id && !it.packaging_material_id)
      .map((it) => ({ price_id: it.price_id, sku_id: it.sku_id })),
    (item) => `${item.price_id}|${item.sku_id}`
  );
  
  const priceRows = await getPricesByIdAndSkuBatch(pairs, client);
  const priceMap = new Map(
    priceRows.map((r) => [
      `${r.price_id}|${r.sku_id}`,
      parseFloat(r.price),
    ])
  );
  
  let subtotal       = 0;
  const enrichedItems = [];
  
  for (let i = 0; i < orderItems.length; i++) {
    const item = orderItems[i];
    
    if (item.packaging_material_id) {
      // Packaging lines are always free — no price_id persisted.
      const lineSubtotal = 0;
      subtotal += lineSubtotal;
      enrichedItems.push({
        ...item,
        price_id: null,
        price:    0,
        subtotal: lineSubtotal,
      });
      continue;
    }
    
    const key     = `${item.price_id}|${item.sku_id}`;
    const dbPrice = priceMap.get(key);
    
    if (dbPrice == null) {
      throw AppError.validationError(
        `Item #${i + 1}: invalid price_id ${item.price_id} for sku_id ${item.sku_id}`
      );
    }
    
    const submittedPrice = item.price != null ? parseFloat(item.price) : undefined;
    const finalPrice     = resolveFinalPrice(submittedPrice, dbPrice);
    const lineSubtotal   = (Number(item.quantity_ordered) || 0) * finalPrice;
    
    subtotal += lineSubtotal;
    
    const metadata =
      submittedPrice != null && finalPrice !== dbPrice
        ? {
          submitted_price: submittedPrice,
          db_price:        dbPrice,
          reason:          'manual override',
        }
        : null;
    
    enrichedItems.push({
      ...item,
      price:    finalPrice,
      subtotal: lineSubtotal,
      ...(metadata ? { metadata } : {}),
    });
  }
  
  return { enrichedItems, subtotal };
};

module.exports = {
  dedupeOrderItems,
  assertPositiveQuantities,
  assertNotPackagingOnly,
  enrichOrderItemsWithResolvedPrice,
};
