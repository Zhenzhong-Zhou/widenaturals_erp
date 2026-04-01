/**
 * @file build-pricing-filter.js
 * @description SQL WHERE clause builder for pricing queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Note: validFrom/validTo/validOn are business-meaningful timestamps —
 * they are NOT normalized through normalizeDateRangeFilters. Only
 * metadata dates (createdAfter/createdBefore) are normalized.
 *
 * Exports:
 *  - buildPricingFilters
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for pricing queries.
 *
 * `_restrictKeywordToValidOnly` / `currentlyValid` are server-injected flags —
 * no params needed, hardcoded NOW() sentinels enforce validity window.
 *
 * validFrom/validTo/validOn are business timestamps passed as-is —
 * not normalized to UTC boundaries since they represent exact pricing dates.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.skuId]                      - Filter by SKU UUID.
 * @param {string}  [filters.priceTypeId]                - Filter by pricing type UUID.
 * @param {string}  [filters.locationId]                 - Filter by location UUID.
 * @param {string}  [filters.statusId]                   - Filter by pricing status UUID.
 * @param {string}  [filters.brand]                      - Exact match on product brand.
 * @param {string}  [filters.pricingType]                - Exact match on pricing type name.
 * @param {string}  [filters.countryCode]                - Exact match on SKU country code.
 * @param {string}  [filters.sizeLabel]                  - Exact match on SKU size label.
 * @param {string}  [filters.validFrom]                  - Lower bound for valid_from (>=).
 * @param {string}  [filters.validTo]                    - Upper bound for valid_to (<=).
 * @param {string}  [filters.validOn]                    - Point-in-time validity check.
 * @param {string}  [filters.keyword]                    - Fuzzy search across product name, sku, pricing type.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - Server-injected: restrict to currently valid.
 * @param {boolean} [filters.currentlyValid]             - If true, restrict to currently valid pricing.
 * @param {string}  [filters.createdAfter]               - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]              - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.createdBy]                  - Filter by creator UUID.
 * @param {string}  [filters.updatedBy]                  - Filter by updater UUID.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingFilters = (filters = {}) => {
  // Only metadata dates are normalized — validFrom/validTo/validOn are not.
  const normalizedFilters = normalizeDateRangeFilters(
    filters, 'createdAfter', 'createdBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Standard Filters ────────────────────────────────────────────────────────
  
  if (normalizedFilters.skuId) {
    conditions.push(`p.sku_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.skuId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.priceTypeId) {
    conditions.push(`p.price_type_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.priceTypeId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.locationId) {
    conditions.push(`p.location_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.locationId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.statusId) {
    conditions.push(`p.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.brand) {
    conditions.push(`pr.brand = $${paramIndexRef.value}`);
    params.push(normalizedFilters.brand);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.pricingType) {
    conditions.push(`pt.name = $${paramIndexRef.value}`);
    params.push(normalizedFilters.pricingType);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.countryCode) {
    conditions.push(`s.country_code = $${paramIndexRef.value}`);
    params.push(normalizedFilters.countryCode);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.sizeLabel) {
    conditions.push(`s.size_label = $${paramIndexRef.value}`);
    params.push(normalizedFilters.sizeLabel);
    paramIndexRef.value++;
  }
  
  // ─── Pricing Validity ────────────────────────────────────────────────────────
  
  // validFrom/validTo/validOn are business timestamps — not normalized.
  if (normalizedFilters.validFrom && normalizedFilters.validTo) {
    conditions.push(`p.valid_from >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validFrom);
    paramIndexRef.value++;
    
    conditions.push(`p.valid_to <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validTo);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.validOn) {
    // Same $N referenced twice — single param checks both boundaries.
    conditions.push(`(
      p.valid_from <= $${paramIndexRef.value} AND
      (p.valid_to IS NULL OR p.valid_to >= $${paramIndexRef.value})
    )`);
    params.push(normalizedFilters.validOn);
    paramIndexRef.value++;
  }
  
  // ─── Keyword (must remain last before server flags) ──────────────────────────
  
  // Same $N referenced three times — single param covers all columns.
  if (normalizedFilters.keyword) {
    const kw = String(normalizedFilters.keyword).trim();
    conditions.push(`(
      pr.name ILIKE $${paramIndexRef.value} OR
      s.sku   ILIKE $${paramIndexRef.value} OR
      pt.name ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${kw}%`);
    paramIndexRef.value++;
  }
  
  // ─── Server-Injected Validity Enforcement ────────────────────────────────────
  
  if (normalizedFilters._restrictKeywordToValidOnly || normalizedFilters.currentlyValid) {
    // No params — hardcoded NOW() sentinels, not user input.
    conditions.push(`p.valid_from <= NOW()`);
    conditions.push(`(p.valid_to IS NULL OR p.valid_to >= NOW())`);
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        'p.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyAuditConditions(conditions, params, paramIndexRef, normalizedFilters, 'p');
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildPricingFilters,
};
