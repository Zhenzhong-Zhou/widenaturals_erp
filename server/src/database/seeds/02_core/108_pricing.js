const { fetchDynamicValue } = require('../_helpers/utils');

// ─────────────────────────────────────────────────────────────────────────
// Pricing data source
// ─────────────────────────────────────────────────────────────────────────
// Real pricing values live in `pricing-data.js`, which is gitignored. Demo
// and CI environments fall back to `pricing-data-dummy.js`, which is
// committed and contains obviously-fake placeholder prices.
//
// To use real pricing in a production deployment, place the real
// `pricing-data.js` on the server (e.g. via SCP) before running seeds.
// All other environments use the dummy data automatically.
//
// MODULE_NOT_FOUND is the only error that triggers the fallback — syntax
// errors or import problems in the real file are re-thrown so they surface
// rather than being silently masked.
// ─────────────────────────────────────────────────────────────────────────

let pricingData;
try {
  pricingData = require('../data/pricing-data');
  console.log('[Pricing seed] Using REAL pricing-data.js');
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
  pricingData = require('../data/pricing-data-dummy');
  console.log('[Pricing seed] Using DUMMY pricing-data-dummy.js (real file not present)');
}

/**
 * Derives country_code from a SKU's suffix.
 *
 * SKU format: `{BRAND}-{CATEGORY}{NNN}-{VARIANT}-{REGION}`
 * The trailing region segment maps to a country_code stored on
 * pricing_groups rows:
 *
 *   - `-CA` → 'CA'
 *   - `-CN` → 'CN'
 *   - `-UN` → 'GLOBAL'
 *
 * Anything else falls back to 'GLOBAL' to avoid throwing on malformed SKUs;
 * the seed will still surface the mismatch downstream when the
 * pricing_group lookup fails.
 *
 * @param {string} sku - Full SKU string.
 * @returns {string} Country code as stored in `pricing_groups.country_code`.
 */
const getCountryCodeFromSku = (sku) => {
  const suffix = sku?.split('-').pop();
  
  if (suffix === 'CA') return 'CA';
  if (suffix === 'CN') return 'CN';
  if (suffix === 'UN') return 'GLOBAL';
  
  return 'GLOBAL';
};

/**
 * Seeds the `pricing` join table that links SKUs to pricing_groups.
 *
 * Reads pricing values from the pricing data module loaded above (real or
 * dummy, depending on file presence), looks up the corresponding
 * pricing_group row by (pricing_type, country_code, price, valid_from),
 * and inserts one `pricing` row per matched combination. Inserts are
 * idempotent via ON CONFLICT (pricing_group_id, sku_id) DO NOTHING, so
 * the seed is safe to re-run.
 *
 * Expects the following to already be seeded:
 *   - `users` (system@internal.local for created_by)
 *   - `skus` (each SKU referenced in pricingData must exist)
 *   - `pricing_types` (Wholesale, Retail, MSRP, Friend and Family Price)
 *   - `pricing_groups` (one row per type × country × price × valid_from)
 *
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  try {
    console.log('[Pricing seed] Starting...');
    
    // ─── Resolve common references ───────────────────────────────────────
    const systemUserId = await fetchDynamicValue(
      knex,
      'users',
      'email',
      'system@internal.local',
      'id'
    );
    
    if (!systemUserId) {
      throw new Error(
        '[Pricing seed] System user `system@internal.local` not found. ' +
        'Ensure the users reference seed has run before pricing.'
      );
    }
    
    // ─── Build lookup maps for pricing_types, skus, and pricing_groups ──
    const pricingTypes = await knex('pricing_types')
      .select('id', 'name')
      .whereIn('name', [
        'Wholesale',
        'Retail',
        'MSRP',
        'Friend and Family Price',
      ]);
    
    const pricingTypeMap = new Map(pricingTypes.map((row) => [row.name, row.id]));
    
    // Fail fast if any expected pricing type is missing — downstream
    // lookups would throw with a less helpful message.
    const expectedTypes = ['Wholesale', 'Retail', 'MSRP', 'Friend and Family Price'];
    const missingTypes = expectedTypes.filter((t) => !pricingTypeMap.has(t));
    if (missingTypes.length > 0) {
      throw new Error(
        `[Pricing seed] Missing required pricing_types: ${missingTypes.join(', ')}. ` +
        'Ensure the pricing_types reference seed has run.'
      );
    }
    
    const skuRows = await knex('skus').select('id', 'sku');
    const skuMap = new Map(skuRows.map((row) => [row.sku, row.id]));
    
    if (skuMap.size === 0) {
      throw new Error(
        '[Pricing seed] No SKUs found in the database. ' +
        'Ensure the products/SKU seed has run before pricing.'
      );
    }
    
    const pricingGroupRows = await knex('pricing_groups').select(
      'id',
      'pricing_type_id',
      'country_code',
      'price',
      'valid_from'
    );
    
    /**
     * Lookup table keyed by `${pricing_type_id}|${country}|${price}|${valid_from_iso}`
     * → pricing_group_id. The composite key matches the uniqueness contract
     * enforced on the pricing_groups table.
     */
    const pricingGroupMap = new Map();
    for (const row of pricingGroupRows) {
      const key = [
        row.pricing_type_id,
        row.country_code,
        Number(row.price).toFixed(2),
        new Date(row.valid_from).toISOString(),
      ].join('|');
      
      pricingGroupMap.set(key, row.id);
    }
    
    // ─── Build the rows to insert ────────────────────────────────────────
    // `valid_from` is fixed across this seed so that pricing data from the
    // module file lines up with the pricing_groups rows seeded with the
    // same timestamp. Update both this constant and the pricing_groups
    // seed in lockstep if the effective date ever changes.
    const fixedTimestamp = new Date('2025-03-01T00:00:00Z');
    const rows = [];
    
    /**
     * Pushes a single pricing row onto the insert batch. Throws with a
     * specific message if any of the required lookups fail, so seed
     * misconfigurations surface during seeding rather than at runtime.
     *
     * @param {string} sku
     * @param {string} priceTypeName
     * @param {number|null|undefined} price
     */
    const addPricingLink = (sku, priceTypeName, price) => {
      if (price === null || price === undefined) return;
      
      const skuId = skuMap.get(sku);
      if (!skuId) {
        throw new Error(`[Pricing seed] SKU not found: ${sku}`);
      }
      
      const priceTypeId = pricingTypeMap.get(priceTypeName);
      if (!priceTypeId) {
        throw new Error(`[Pricing seed] Pricing type not found: ${priceTypeName}`);
      }
      
      const countryCode = getCountryCodeFromSku(sku);
      const normalizedPrice = Number(price).toFixed(2);
      
      const pricingGroupKey = [
        priceTypeId,
        countryCode,
        normalizedPrice,
        fixedTimestamp.toISOString(),
      ].join('|');
      
      const pricingGroupId = pricingGroupMap.get(pricingGroupKey);
      if (!pricingGroupId) {
        throw new Error(
          `[Pricing seed] Pricing group not found for SKU ${sku}, ` +
          `type ${priceTypeName}, country ${countryCode}, price ${normalizedPrice}. ` +
          'Verify pricing_groups seed includes a row with these exact values.'
        );
      }
      
      rows.push({
        pricing_group_id: pricingGroupId,
        sku_id: skuId,
        created_by: systemUserId,
      });
    };
    
    // Walk every entry in the pricing data module and queue inserts for
    // each price tier. `addPricingLink` skips null/undefined prices, so
    // entries missing certain tiers (e.g. no friend_and_family) are safe.
    for (const entry of pricingData) {
      addPricingLink(entry.sku, 'Wholesale', entry.wholesale);
      addPricingLink(entry.sku, 'MSRP', entry.msrp);
      addPricingLink(entry.sku, 'Retail', entry.retail);
      addPricingLink(entry.sku, 'Friend and Family Price', entry.friend_and_family);
    }
    
    // ─── Insert ──────────────────────────────────────────────────────────
    if (rows.length === 0) {
      console.warn(
        '[Pricing seed] No pricing rows built — pricingData was empty or all ' +
        'prices were null. Skipping insert.'
      );
      return;
    }
    
    await knex('pricing')
      .insert(rows)
      .onConflict(['pricing_group_id', 'sku_id'])
      .ignore();
    
    console.log(`[Pricing seed] ${rows.length} pricing records seeded successfully.`);
  } catch (err) {
    // Re-throw so Knex's seed runner sees the failure. The console.error
    // here is intentional even given the single-log principle elsewhere
    // in the codebase — seeds run outside the app's logging infrastructure
    // and rely on stdout/stderr for visibility.
    console.error('[Pricing seed] Failed:', err.message);
    throw err;
  }
};
