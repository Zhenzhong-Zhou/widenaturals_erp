/**
 * @file build-warehouse-type-filter.js
 * @description SQL WHERE clause builder for warehouse_types queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Active-only enforcement is NOT defaulted here. Restricted callers are
 * pinned to `isActive: true` by the business layer; this builder applies
 * a WHERE clause only when `isActive` is explicitly set on the input.
 *
 * Exports:
 *  - buildWarehouseTypeFilters
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for warehouse_types queries.
 *
 * Column anchor:
 *  wt. — warehouse_types
 *
 * @param {WarehouseTypeFilters} [filters={}]
 * @returns {{ whereClause: string, params: Array }}
 */
const buildWarehouseTypeFilters = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };
  
  const { isActive, keyword } = normalizedFilters;
  
  // ─── State ─────────────────────────────────────────────────────────────────
  
  if (typeof isActive === 'boolean') {
    conditions.push(`wt.is_active = $${paramIndexRef.value++}`);
    params.push(isActive);
  }
  
  // ─── Keyword ───────────────────────────────────────────────────────────────
  
  if (keyword) {
    conditions.push(`wt.name ILIKE $${paramIndexRef.value++}`);
    params.push(`%${String(keyword).trim()}%`);
  }
  
  // ─── Audit ─────────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column: 'wt.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyAuditConditions(
    conditions,
    params,
    paramIndexRef,
    normalizedFilters,
    'wt'
  );
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildWarehouseTypeFilters,
};
