const {
  getPricesByIdAndSkuBatch,
} = require('../repositories/pricing-repository');
const AppError = require('../utils/AppError');
const { resolveFinalPrice } = require('./pricing-business');

/**
 * Build a stable identity key for an order item.
 * Kind is inferred: SKU if `sku_id`, else Packaging if `packaging_material_id`.
 * Identity uses primary id + (price_id OR override_price) + optional extra fields.
 * Note: `price` (client display) is ignored; only `override_price` affects identity.
 *
 * @param {object} item
 * @param {object} [opts]
 * @param {string[]} [opts.extraFields=[]] - Extra field names to include in the key (e.g. ['uom_id']).
 * @returns {string} A stable key used for deduplication.
 * @example
 * buildDedupeKey({ sku_id:'A', price_id:'P' }) // "sku|A|price:P"
 */
const buildDedupeKey = (item, opts = {}) => {
  const { extraFields = [] } = opts;

  // infer kind
  const isSku = !!item.sku_id;
  const isPkg = !!item.packaging_material_id;

  const kind = isSku ? 'sku' : isPkg ? 'pkg' : 'unknown'; // still allow dedupe on unknown with provided fields

  const parts = [kind];

  // primary identity
  if (isSku) parts.push(item.sku_id);
  if (isPkg) parts.push(item.packaging_material_id);

  // price identity (prefer catalog price_id, else override_price)
  if (item.price_id != null) {
    parts.push(`price:${item.price_id}`);
  } else if (item.override_price != null) {
    parts.push(`ovr:${item.override_price}`);
  } else {
    parts.push('price:'); // placeholder to keep shape stable
  }

  // any extras (stable order)
  for (const f of extraFields) {
    parts.push(`${f}:${item[f] ?? ''}`);
  }

  return parts.join('|');
};

/**
 * Merge duplicate order items by identity key and sum `quantity_ordered`.
 * Does not mutate the input array or its objects.
 *
 * @param {Array<object>} items - Raw order items.
 * @param {object} [opts] - Passed through to `buildDedupeKey` (e.g. { extraFields:['uom_id'] }).
 * @returns {Array<object>} New array with merged items.
 * @example
 * dedupeOrderItems([{sku_id:'A', price_id:'P', quantity_ordered:1},
 *                   {sku_id:'A', price_id:'P', quantity_ordered:2}])
 * // => [{sku_id:'A', price_id:'P', quantity_ordered:3}]
 */
const dedupeOrderItems = (items, opts = {}) => {
  const map = new Map();

  for (const it of items ?? []) {
    const key = buildDedupeKey(it, opts);
    const prev = map.get(key);

    if (prev) {
      const prevQty = Number(prev.quantity_ordered) || 0;
      const addQty = Number(it.quantity_ordered) || 0;
      map.set(key, { ...prev, quantity_ordered: prevQty + addQty });
    } else {
      // shallow clone so caller’s objects aren’t mutated
      map.set(key, { ...it });
    }
  }

  return Array.from(map.values());
};

/**
 * Assert that every item has a strictly positive `quantity_ordered`.
 * Intended as a business-layer safeguard (in addition to schema + DB CHECK).
 *
 * @param {Array<object>} items
 * @throws {AppError} If any quantity is missing, NaN, or <= 0.
 */

const assertPositiveQuantities = (items) => {
  items.forEach((it, i) => {
    if (!(Number(it.quantity_ordered) > 0)) {
      throw AppError.validationError(`Item #${i + 1}: quantity must be > 0`);
    }
  });
};

/**
 * Sales-order rule: the order must include at least one SKU item.
 * Packaging-only orders are rejected.
 *
 * @param {Array<object>} items
 * @throws {AppError} If no item has `sku_id`.
 */
const assertNotPackagingOnly = (items) => {
  const hasSku = items.some((it) => !!it.sku_id);
  if (!hasSku) {
    throw AppError.validationError(
      'Sales order must include at least one product (SKU) item; packaging-only is not allowed.'
    );
  }
};

/**
 * Enrich sales order items with resolved pricing and calculated subtotals (batched).
 *
 * How it works:
 * - Collects unique (price_id, sku_id) pairs from SKU lines and fetches their catalog prices
 *   in **one** DB round-trip (via `getPricesByIdAndSkuBatch`).
 * - Validates each SKU line’s `(price_id, sku_id)`; if no matching pricing row exists,
 *   throws a validation error pointing to the item index.
 * - Uses `resolveFinalPrice(submittedPrice, dbPrice)` to determine the final unit price
 *   (e.g., accept manual override, or fall back to the catalog price).
 * - Computes line `subtotal = quantity_ordered * finalPrice` without rounding to preserve
 *   precision for downstream tax/rounding logic.
 * - Attaches `metadata` when a manual override occurs: `{ submitted_price, db_price, reason }`.
 *
 * Packaging lines:
 * - Treated as zero-priced items (`price = 0`).
 * - `price_id` is forced to `null` to avoid persisting irrelevant references.
 * - Subtotal is always `quantity_ordered * 0`.
 *
 * Assumptions / Notes:
 * - Call this on a **deduped** items array (duplicates merged upstream).
 * - Quantities should already be validated as positive.
 * - Current implementation expects SKU lines to include a `price_id` that belongs to the `sku_id`.
 *   If you support SKU lines without `price_id` (pure overrides), adjust the fetch/resolve logic accordingly.
 *
 * @param {Array<object>} orderItems - Items with:
 *   - `sku_id` {string} (for SKU lines)
 *   - `price_id` {string|null} (required for SKU lines in this implementation)
 *   - `quantity_ordered` {number}
 *   - `price` {number|null} (client-submitted; may be overridden)
 *   - `packaging_material_id` {string|null}
 * @param {import('pg').PoolClient|null} client - Optional DB client/transaction
 *
 * @returns {Promise<{ enrichedItems: Array<object>, subtotal: number }>}
 *   - `enrichedItems`: items augmented with resolved `price`, `subtotal`, and optional `metadata`
 *   - `subtotal`: sum of all line subtotals (number)
 *
 * @throws {AppError}
 *   - `validationError` when `(price_id, sku_id)` is invalid for a SKU line
 *   - `databaseError` if the batch pricing query fails
 */
const enrichOrderItemsWithResolvedPrice = async (orderItems, client) => {
  // 0) Collect unique (price_id, sku_id) pairs for SKU lines
  const pairs = [];
  const seen = new Set();
  for (const it of orderItems) {
    if (it.sku_id && it.price_id && !it.packaging_material_id) {
      const k = `${it.price_id}|${it.sku_id}`;
      if (!seen.has(k)) {
        seen.add(k);
        pairs.push({ price_id: it.price_id, sku_id: it.sku_id });
      }
    }
  }

  // 1) One round-trip: fetch catalog prices for all pairs
  const priceRows = await getPricesByIdAndSkuBatch(pairs, client);
  const priceMap = new Map(
    priceRows.map((r) => [`${r.price_id}|${r.sku_id}`, parseFloat(r.price)])
  );

  // 2) Enrich items + compute subtotal
  let subtotal = 0;
  const enrichedItems = [];

  for (let i = 0; i < orderItems.length; i++) {
    const item = orderItems[i];

    // ---- CASE: Packaging (always zero-priced) ----
    if (item.packaging_material_id) {
      const finalPrice = 0;
      const lineSubtotal = (Number(item.quantity_ordered) || 0) * finalPrice;

      subtotal += lineSubtotal;
      enrichedItems.push({
        ...item,
        price_id: null, // ensure we don't persist irrelevant price IDs
        price: finalPrice, // packaging is free
        subtotal: lineSubtotal,
      });
      continue;
    }

    // ---- CASE: SKU lines ----
    const key = `${item.price_id}|${item.sku_id}`;
    const dbPrice = priceMap.get(key);

    if (dbPrice == null) {
      // pair didn’t come back → invalid mapping
      throw AppError.validationError(
        `Item #${i + 1}: invalid price_id ${item.price_id} for sku_id ${item.sku_id}`
      );
    }

    const submittedPrice =
      item.price != null ? parseFloat(item.price) : undefined;

    // Resolve final price via your business rule (e.g., allow manual override)
    const finalPrice = resolveFinalPrice(submittedPrice, dbPrice);

    const lineSubtotal = (Number(item.quantity_ordered) || 0) * finalPrice;
    subtotal += lineSubtotal;

    const metadata =
      submittedPrice != null && finalPrice !== dbPrice
        ? {
            submitted_price: submittedPrice,
            db_price: dbPrice,
            reason: 'manual override',
          }
        : null;

    enrichedItems.push({
      ...item,
      price: finalPrice, // trusted resolved price
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
