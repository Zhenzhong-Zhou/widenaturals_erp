/**
 * @file build-inventory-status-filter.js
 * @description SQL WHERE clause builder for inventory_status queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Active-only enforcement is NOT defaulted here. Restricted callers are
 * pinned to `isActive: true` by the business layer
 * (resolveInventoryStatusLookupFilters); this builder applies a WHERE
 * clause only when `isActive` is explicitly set on the input.
 *
 * Exports:
 *  - buildInventoryStatusFilters
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for inventory_status queries.
 *
 * Column anchor:
 *  ist. — inventory_status
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.ids]           - Restrict to these inventory_status UUIDs.
 * @param {string[]} [filters.excludeIds]    - Exclude these inventory_status UUIDs.
 * @param {boolean}  [filters.isActive]      - Filter by is_active flag (typically pinned by the business layer).
 * @param {string}   [filters.keyword]       - ILIKE search on name.
 * @param {string}   [filters.createdAfter]  - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore] - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.createdBy]     - Filter by creator UUID.
 * @param {string}   [filters.updatedBy]     - Filter by updater UUID.
 * @returns {{ whereClause: string, params: Array }}
 */
const buildInventoryStatusFilters = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Identity ──────────────────────────────────────────────────────────────
  
  if (Array.isArray(normalizedFilters.ids) && normalizedFilters.ids.length) {
    conditions.push(`ist.id = ANY($${paramIndexRef.value++}::uuid[])`);
    params.push(normalizedFilters.ids);
  }
  
  if (
    Array.isArray(normalizedFilters.excludeIds) &&
    normalizedFilters.excludeIds.length
  ) {
    conditions.push(`ist.id <> ALL($${paramIndexRef.value++}::uuid[])`);
    params.push(normalizedFilters.excludeIds);
  }
  
  // ─── State ─────────────────────────────────────────────────────────────────
  
  if (typeof normalizedFilters.isActive === 'boolean') {
    conditions.push(`ist.is_active = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.isActive);
  }
  
  // ─── Keyword ───────────────────────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    const kw = `%${String(normalizedFilters.keyword).trim()}%`;
    conditions.push(`ist.name ILIKE $${paramIndexRef.value++}`);
    params.push(kw);
  }
  
  // ─── Audit ─────────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column: 'ist.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyAuditConditions(
    conditions,
    params,
    paramIndexRef,
    normalizedFilters,
    'ist'
  );
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildInventoryStatusFilters,
};
