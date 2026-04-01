/**
 * @file build-location-type-filter.js
 * @description SQL WHERE clause builder for location type queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildLocationTypeFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for location type queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * Status resolution:
 *  - If enforceActiveOnly is true and no explicit statusIds are provided,
 *    restricts to activeStatusId — used for non-admin visibility enforcement.
 *  - If statusIds are provided, they take priority over enforceActiveOnly.
 *
 * The `options.canSearchStatus` flag controls whether keyword search includes
 * the status name field — requires the caller to join status in the query.
 *
 * @param {Object}  [filters={}]
 * @param {boolean} [filters.enforceActiveOnly]  - If true and no statusIds, restrict to activeStatusId.
 * @param {string}  [filters.activeStatusId]     - Server-injected active status UUID.
 * @param {string[]} [filters.statusIds]         - Explicit status UUID filter.
 * @param {string}  [filters.createdBy]          - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]          - Filter by updater user UUID.
 * @param {string}  [filters.createdAfter]       - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]      - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.updatedAfter]       - Lower bound for updated_at (inclusive, UTC).
 * @param {string}  [filters.updatedBefore]      - Upper bound for updated_at (exclusive, UTC).
 * @param {string}  [filters.name]               - ILIKE filter on location type name.
 * @param {string}  [filters.code]               - ILIKE filter on location type code.
 * @param {string}  [filters.keyword]            - Fuzzy search across name, code, and optionally status name.
 * @param {Object}  [options={}]
 * @param {boolean} [options.canSearchStatus]    - If true, includes s.name in keyword search.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildLocationTypeFilter = (filters = {}, options = {}) => {
  // Normalize all date ranges — handles both raw strings and Joi-coerced Date objects.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter', 'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  const { canSearchStatus = false } = options;
  
  const enforceActiveOnly = normalizedFilters.enforceActiveOnly === true;
  const hasStatusFilter   = Array.isArray(normalizedFilters.statusIds) &&
    normalizedFilters.statusIds.length > 0;
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  if (enforceActiveOnly && !hasStatusFilter && normalizedFilters.activeStatusId) {
    // Server-enforced active-only visibility — only applied when no explicit
    // status filter is present and enforceActiveOnly is set by the caller.
    conditions.push(`lt.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.activeStatusId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`lt.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`lt.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`lt.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'lt.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'lt.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── Text ────────────────────────────────────────────────────────────────────
  
  // addIlikeFilter returns the next available param index — must be explicitly reassigned.
  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.name,
    'lt.name'
  );
  
  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.code,
    'lt.code'
  );
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced across all keyword fields — single param.
  // s.name is only included when canSearchStatus is true — requires status join in caller.
  if (normalizedFilters.keyword) {
    const keywordConditions = [
      `lt.name ILIKE $${paramIndexRef.value}`,
      `lt.code ILIKE $${paramIndexRef.value}`,
    ];
    
    if (canSearchStatus) {
      keywordConditions.push(`s.name ILIKE $${paramIndexRef.value}`);
    }
    
    conditions.push(`(${keywordConditions.join(' OR ')})`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildLocationTypeFilter,
};
