/**
 * @file build-product-batch-filter.js
 * @description SQL WHERE clause builder for product batch queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildProductBatchFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addKeywordIlikeGroup } = require('./sql-helpers');

/**
 * Builds a parameterised SQL WHERE clause for product batch queries.
 *
 * `forceEmptyResult` short-circuits all conditions and returns a zero-row
 * clause — injected by the business layer when the caller has no visibility.
 *
 * The keyword block must remain last — addKeywordIlikeGroup advances the
 * param index internally and does not return the updated value.
 *
 * @param {Object}   [filters={}]
 * @param {boolean}  [filters.forceEmptyResult]          - If true, returns zero-row clause immediately.
 * @param {string[]} [filters.statusIds]                 - Filter by batch status UUIDs.
 * @param {string[]} [filters.skuIds]                    - Filter by SKU UUIDs.
 * @param {string[]} [filters.productIds]                - Filter by product UUIDs.
 * @param {string[]} [filters.manufacturerIds]           - Filter by manufacturer UUIDs.
 * @param {string}   [filters.lotNumber]                 - ILIKE filter on lot number.
 * @param {string}   [filters.expiryAfter]               - Lower bound for expiry_date (inclusive, UTC).
 * @param {string}   [filters.expiryBefore]              - Upper bound for expiry_date (exclusive, UTC).
 * @param {string}   [filters.keyword]                   - Fuzzy keyword search across permission-gated fields.
 * @param {Object}   [filters.keywordCapabilities]       - Permission flags controlling keyword search scope.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildProductBatchFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters, 'expiryAfter', 'expiryBefore'
  );
  
  // Hard fail-closed — short-circuits before building any conditions.
  if (normalizedFilters.forceEmptyResult === true) {
    return { whereClause: '1=1 AND 1=0', params: [] };
  }
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`pb.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  // ─── SKU / Product / Manufacturer ────────────────────────────────────────────
  
  if (normalizedFilters.skuIds?.length) {
    conditions.push(`pb.sku_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.skuIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.productIds?.length) {
    conditions.push(`p.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.productIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.manufacturerIds?.length) {
    conditions.push(`pb.manufacturer_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.manufacturerIds);
    paramIndexRef.value++;
  }
  
  // ─── Lot Number ──────────────────────────────────────────────────────────────
  
  if (normalizedFilters.lotNumber) {
    conditions.push(`pb.lot_number ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.lotNumber}%`);
    paramIndexRef.value++;
  }
  
  // ─── Expiry Date ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        'pb.expiry_date',
    after:         normalizedFilters.expiryAfter,
    before:        normalizedFilters.expiryBefore,
    paramIndexRef,
  });
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  if (normalizedFilters.keyword && normalizedFilters.keywordCapabilities) {
    const { canSearchProduct, canSearchSku, canSearchManufacturer } =
      normalizedFilters.keywordCapabilities;
    
    const searchableFields = ['pb.lot_number'];
    
    if (canSearchProduct)      searchableFields.push('p.name');
    if (canSearchSku)          searchableFields.push('sk.sku');
    if (canSearchManufacturer) searchableFields.push('m.name');
    
    addKeywordIlikeGroup(
      conditions,
      params,
      paramIndexRef.value,
      normalizedFilters.keyword,
      searchableFields
    );
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildProductBatchFilter,
};
