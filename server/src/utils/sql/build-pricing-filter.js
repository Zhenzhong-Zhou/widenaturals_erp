/**
 * @file build-pricing-filter.js
 * @description SQL WHERE clause builders for pricing queries.
 *
 * Pure functions — no DB access, no logging, no side effects on inputs.
 *
 * Note: validFrom/validTo/validOn are business-meaningful timestamps —
 * they are NOT normalized through normalizeDateRangeFilters. Only
 * metadata dates (createdAfter/createdBefore) are normalized.
 *
 * Exports:
 *  - buildPricingFilters       — legacy lookup/filter query (pricing_groups as anchor)
 *  - buildPricingSkuFilters    — SKU-granular query filters (within a group or cross-group)
 *  - buildPricingExportFilters — export query filters (cross-group, group-level scope)
 */

'use strict';

// ─── Pricing SKU Filters (per-group SKU table + cross-group SKU search) ───────

/**
 * Builds a parameterised WHERE clause for SKU-granular pricing queries.
 *
 * When pricingGroupId is provided the query is scoped to that group (detail
 * page SKU table). When omitted all groups are searched (cross-group SKU lookup).
 *
 * @param {Object}  params
 * @param {string|null} pricingGroupId - Scope to a specific pricing group, or null for cross-group.
 * @param {Object}  [filters={}]
 * @param {string}  [filters.search]      - Fuzzy match on sku, barcode, product name.
 * @param {string}  [filters.brand]       - Exact match on product brand.
 * @param {string}  [filters.category]    - Exact match on product category.
 * @param {string}  [filters.productId]   - Filter by product UUID.
 * @param {string}  [filters.skuId]       - Filter by SKU UUID.
 * @param {string}  [filters.countryCode] - Exact match on SKU country code.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingSkuFilters = ({ pricingGroupId, filters = {} }) => {
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  if (pricingGroupId) {
    conditions.push(`p.pricing_group_id = $${paramIndexRef.value++}`);
    params.push(pricingGroupId);
  }
  
  if (filters.search) {
    conditions.push(`(
      s.sku     ILIKE $${paramIndexRef.value} OR
      s.barcode ILIKE $${paramIndexRef.value} OR
      pr.name   ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${filters.search}%`);
    paramIndexRef.value++;
  }
  
  if (filters.brand) {
    conditions.push(`pr.brand = $${paramIndexRef.value++}`);
    params.push(filters.brand);
  }
  
  if (filters.category) {
    conditions.push(`pr.category = $${paramIndexRef.value++}`);
    params.push(filters.category);
  }
  
  if (filters.productId) {
    conditions.push(`pr.id = $${paramIndexRef.value++}`);
    params.push(filters.productId);
  }
  
  if (filters.skuId) {
    conditions.push(`s.id = $${paramIndexRef.value++}`);
    params.push(filters.skuId);
  }
  
  if (filters.countryCode) {
    conditions.push(`s.country_code = $${paramIndexRef.value++}`);
    params.push(filters.countryCode);
  }
  
  return { whereClause: conditions.join('\n  AND '), params };
};

// ─── Pricing Export Filters (cross-group, group-level scope) ──────────────────

/**
 * Builds a parameterised WHERE clause for full pricing export queries.
 *
 * Scoped to group-level and product-level fields only — no SKU-level filters
 * since export includes all SKUs per matching group.
 *
 * @param {Object} [filters={}]
 * @param {string} [filters.pricingTypeId] - Filter by pricing type UUID.
 * @param {string} [filters.countryCode]   - Exact match on pricing group country code.
 * @param {string} [filters.statusId]      - Filter by pricing group status UUID.
 * @param {string} [filters.brand]         - Exact match on product brand.
 * @param {string} [filters.productId]     - Filter by product UUID.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingExportFilters = (filters = {}) => {
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  if (filters.pricingTypeId) {
    conditions.push(`pg.pricing_type_id = $${paramIndexRef.value++}`);
    params.push(filters.pricingTypeId);
  }
  
  if (filters.countryCode) {
    conditions.push(`pg.country_code = $${paramIndexRef.value++}`);
    params.push(filters.countryCode);
  }
  
  if (filters.statusId) {
    conditions.push(`pg.status_id = $${paramIndexRef.value++}`);
    params.push(filters.statusId);
  }
  
  if (filters.brand) {
    conditions.push(`pr.brand = $${paramIndexRef.value++}`);
    params.push(filters.brand);
  }
  
  if (filters.productId) {
    conditions.push(`pr.id = $${paramIndexRef.value++}`);
    params.push(filters.productId);
  }
  
  return { whereClause: conditions.join('\n  AND '), params };
};

module.exports = {
  buildPricingSkuFilters,
  buildPricingExportFilters,
};
