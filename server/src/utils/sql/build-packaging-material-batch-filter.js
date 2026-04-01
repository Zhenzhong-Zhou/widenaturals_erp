/**
 * @file build-packaging-material-batch-filter.js
 * @description SQL WHERE clause builder for packaging material batch queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildPackagingMaterialBatchFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addKeywordIlikeGroup } = require('./sql-helpers');

/**
 * Builds a parameterised SQL WHERE clause for packaging material batch queries.
 *
 * `forceEmptyResult` short-circuits all conditions and returns a zero-row
 * clause — injected by the business layer when the caller has no visibility.
 *
 * The keyword block must remain last — addKeywordIlikeGroup advances the
 * param index internally and does not return the updated value.
 *
 * @param {Object}   [filters={}]
 * @param {boolean}  [filters.forceEmptyResult]              - If true, returns zero-row clause immediately.
 * @param {string[]} [filters.statusIds]                     - Filter by batch status UUIDs.
 * @param {string[]} [filters.packagingMaterialIds]          - Filter by packaging material UUIDs.
 * @param {string[]} [filters.supplierIds]                   - Filter by supplier UUIDs.
 * @param {boolean}  [filters.preferredSupplierOnly]         - If true, restricts to preferred supplier links.
 * @param {string}   [filters.lotNumber]                     - ILIKE filter on lot number.
 * @param {string}   [filters.expiryAfter]                   - Lower bound for expiry_date (inclusive, UTC).
 * @param {string}   [filters.expiryBefore]                  - Upper bound for expiry_date (exclusive, UTC).
 * @param {string}   [filters.receivedAfter]                 - Lower bound for received_at (inclusive, UTC).
 * @param {string}   [filters.receivedBefore]                - Upper bound for received_at (exclusive, UTC).
 * @param {string}   [filters.keyword]                       - Fuzzy keyword search across permission-gated fields.
 * @param {Object}   [filters.keywordCapabilities]           - Permission flags controlling keyword search scope.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPackagingMaterialBatchFilter = (filters = {}) => {
  // Normalize all date ranges — handles both raw strings and Joi-coerced Date objects.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'expiryAfter', 'expiryBefore'),
    'receivedAfter', 'receivedBefore'
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
    conditions.push(`pmb.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  // ─── Material / Supplier ─────────────────────────────────────────────────────
  
  if (normalizedFilters.packagingMaterialIds?.length) {
    conditions.push(`pm.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.packagingMaterialIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.supplierIds?.length) {
    conditions.push(`s.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.supplierIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.preferredSupplierOnly === true) {
    // No param — hardcoded sentinel, not user input.
    conditions.push(`pms.is_preferred = true`);
  }
  
  // ─── Lot Number ──────────────────────────────────────────────────────────────
  
  if (normalizedFilters.lotNumber) {
    conditions.push(`pmb.lot_number ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.lotNumber}%`);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        'pmb.expiry_date',
    after:         normalizedFilters.expiryAfter,
    before:        normalizedFilters.expiryBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions, params,
    column:        'pmb.received_at',
    after:         normalizedFilters.receivedAfter,
    before:        normalizedFilters.receivedBefore,
    paramIndexRef,
  });
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // addKeywordIlikeGroup advances the param index internally and does not
  // return the updated value — any condition added after this block would
  // use a stale index.
  if (normalizedFilters.keyword && normalizedFilters.keywordCapabilities) {
    const {
      canSearchInternalName,
      canSearchSupplierLabel,
      canSearchMaterialCode,
      canSearchSupplier,
    } = normalizedFilters.keywordCapabilities;
    
    const searchableFields = ['pmb.lot_number'];
    
    if (canSearchInternalName)  searchableFields.push('pmb.material_snapshot_name');
    if (canSearchSupplierLabel) searchableFields.push('pmb.received_label_name');
    if (canSearchMaterialCode)  searchableFields.push('pm.code');
    if (canSearchSupplier)      searchableFields.push('s.name');
    
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
  buildPackagingMaterialBatchFilter,
};
