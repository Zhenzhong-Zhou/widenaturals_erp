/**
 * @file build-pricing-group-filter.js
 * @description SQL WHERE clause builder for pricing group queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildPricingGroupFilters
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for pricing group queries.
 *
 * Column anchors:
 *  pg. — pricing_groups
 *  pt. — pricing_types
 *  pr. — products (via pricing join table)
 *  s.  — skus (via pricing join table)
 *
 * skuId and productId use EXISTS subqueries to avoid interfering with
 * COUNT(DISTINCT p.sku_id) aggregations in the list query.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.pricingTypeId]              - Filter by pricing type UUID.
 * @param {string}  [filters.statusId]                   - Filter by status UUID.
 * @param {string}  [filters.countryCode]                - Exact match on country code.
 * @param {string}  [filters.brand]                      - Exact match on product brand.
 * @param {string}  [filters.sizeLabel]                  - Exact match on SKU size label.
 * @param {number}  [filters.priceMin]                   - Minimum price (inclusive).
 * @param {number}  [filters.priceMax]                   - Maximum price (inclusive).
 * @param {string}  [filters.validFrom]                  - Lower bound for valid_from (>=).
 * @param {string}  [filters.validTo]                    - Upper bound for valid_to (<=).
 * @param {string}  [filters.validOn]                    - Point-in-time validity check.
 * @param {string}  [filters.skuId]                      - Filter groups containing this SKU UUID.
 * @param {string}  [filters.productId]                  - Filter groups containing any SKU from this product UUID.
 * @param {string}  [filters.keyword]                    - Fuzzy search across product name, sku, barcode, pricing type.
 * @param {boolean} [filters._restrictKeywordToValidOnly]- Server-injected: restrict to currently valid.
 * @param {boolean} [filters.currentlyValid]             - Restrict to currently valid pricing groups.
 * @param {string}  [filters.createdAfter]               - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]              - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.createdBy]                  - Filter by creator UUID.
 * @param {string}  [filters.updatedBy]                  - Filter by updater UUID.
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingGroupFilters = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters, 'createdAfter', 'createdBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  if (normalizedFilters.pricingTypeId) {
    conditions.push(`pg.pricing_type_id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.pricingTypeId);
  }
  
  if (normalizedFilters.statusId) {
    conditions.push(`pg.status_id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.statusId);
  }
  
  if (normalizedFilters.countryCode) {
    conditions.push(`pg.country_code = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.countryCode);
  }
  
  if (normalizedFilters.brand) {
    conditions.push(`pr.brand = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.brand);
  }
  
  if (normalizedFilters.sizeLabel) {
    conditions.push(`s.size_label = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.sizeLabel);
  }
  
  if (normalizedFilters.priceMin != null) {
    conditions.push(`pg.price >= $${paramIndexRef.value++}`);
    params.push(normalizedFilters.priceMin);
  }
  
  if (normalizedFilters.priceMax != null) {
    conditions.push(`pg.price <= $${paramIndexRef.value++}`);
    params.push(normalizedFilters.priceMax);
  }
  
  // ─── Pricing Validity ──────────────────────────────────────────────────────
  
  if (normalizedFilters.validFrom) {
    conditions.push(`pg.valid_from >= $${paramIndexRef.value++}`);
    params.push(normalizedFilters.validFrom);
  }
  
  if (normalizedFilters.validTo) {
    conditions.push(`pg.valid_to <= $${paramIndexRef.value++}`);
    params.push(normalizedFilters.validTo);
  }
  
  if (normalizedFilters.validOn) {
    // Same $N referenced twice — single param checks both boundaries.
    conditions.push(`(
      pg.valid_from <= $${paramIndexRef.value} AND
      (pg.valid_to IS NULL OR pg.valid_to >= $${paramIndexRef.value})
    )`);
    params.push(normalizedFilters.validOn);
    paramIndexRef.value++;
  }
  
  // ─── EXISTS Subqueries (avoid COUNT aggregation interference) ─────────────
  
  if (normalizedFilters.skuId) {
    conditions.push(`EXISTS (
      SELECT 1 FROM pricing p
      WHERE p.pricing_group_id = pg.id
        AND p.sku_id = $${paramIndexRef.value++}
    )`);
    params.push(normalizedFilters.skuId);
  }
  
  if (normalizedFilters.productId) {
    conditions.push(`EXISTS (
      SELECT 1 FROM pricing p
      JOIN skus s ON s.id = p.sku_id
      WHERE p.pricing_group_id = pg.id
        AND s.product_id = $${paramIndexRef.value++}
    )`);
    params.push(normalizedFilters.productId);
  }
  
  // ─── Keyword ───────────────────────────────────────────────────────────────
  
  // Same $N referenced four times — single param covers all columns.
  if (normalizedFilters.keyword) {
    const kw = `%${String(normalizedFilters.keyword).trim()}%`;
    conditions.push(`(
      pr.name  ILIKE $${paramIndexRef.value} OR
      s.sku    ILIKE $${paramIndexRef.value} OR
      s.barcode ILIKE $${paramIndexRef.value} OR
      pt.name  ILIKE $${paramIndexRef.value}
    )`);
    params.push(kw);
    paramIndexRef.value++;
  }
  
  // ─── Server-Injected Validity Enforcement ─────────────────────────────────
  
  if (normalizedFilters._restrictKeywordToValidOnly || normalizedFilters.currentlyValid) {
    conditions.push(`pg.valid_from <= NOW()`);
    conditions.push(`(pg.valid_to IS NULL OR pg.valid_to >= NOW())`);
  }
  
  // ─── Audit ─────────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'pg.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyAuditConditions(conditions, params, paramIndexRef, normalizedFilters, 'pg');
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildPricingGroupFilters,
};
