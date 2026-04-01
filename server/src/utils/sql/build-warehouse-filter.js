/**
 * @file build-warehouse-filter.js
 * @description SQL WHERE clause builder for warehouse queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildWarehouseFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for warehouse queries.
 *
 * Normalizes created/updated date range filters to UTC ISO boundaries before
 * applying conditions.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.statusId]        - Exact match on warehouse status UUID.
 * @param {boolean} [filters.isArchived]       - Exact match on archived flag.
 * @param {string}  [filters.warehouseTypeId]  - Exact match on warehouse type UUID.
 * @param {string}  [filters.locationId]       - Exact match on location UUID.
 * @param {string}  [filters.name]             - ILIKE filter on warehouse name.
 * @param {string}  [filters.code]             - ILIKE filter on warehouse code.
 * @param {string}  [filters.createdBy]        - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]        - Filter by updater user UUID.
 * @param {string}  [filters.createdAfter]     - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]    - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.updatedAfter]     - Lower bound for updated_at (inclusive, UTC).
 * @param {string}  [filters.updatedBefore]    - Upper bound for updated_at (exclusive, UTC).
 * @param {string}  [filters.keyword]          - Fuzzy search across name and code.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildWarehouseFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Exact-match filters ──────────────────────────────────────────────────────
  
  if (normalizedFilters.statusId) {
    conditions.push(`w.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.isArchived !== undefined) {
    conditions.push(`w.is_archived = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isArchived);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.warehouseTypeId) {
    conditions.push(`w.type_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.warehouseTypeId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.locationId) {
    conditions.push(`w.location_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.locationId);
    paramIndexRef.value++;
  }
  
  // ─── ILIKE filters ────────────────────────────────────────────────────────────
  
  if (normalizedFilters.name) {
    conditions.push(`w.name ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.name}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.code) {
    conditions.push(`w.code ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.code}%`);
    paramIndexRef.value++;
  }
  
  // ─── Audit filters ────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`w.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`w.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date range filters ───────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'w.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'w.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── Keyword (must remain last) ───────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    // Collapse internal whitespace before wrapping — prevents double-space
    // literals from breaking ILIKE matches on normalized DB values.
    const kw = `%${normalizedFilters.keyword.trim().replace(/\s+/g, ' ')}%`;
    conditions.push(`(
      w.name ILIKE $${paramIndexRef.value} OR
      w.code ILIKE $${paramIndexRef.value}
    )`);
    params.push(kw);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildWarehouseFilter,
};
