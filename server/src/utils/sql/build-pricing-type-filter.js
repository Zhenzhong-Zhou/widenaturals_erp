/**
 * @file build-pricing-type-filter.js
 * @description SQL WHERE clause builder for pricing type queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildPricingTypeFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for pricing type queries.
 *
 * Column anchor: pt. — pricing_types
 *
 * Status handling:
 *  - statusId present → applied as a WHERE condition
 *  - statusId absent  → no status filter (privileged caller seeing all)
 *
 * The decision of which statusId to pin (or whether to omit it) lives in
 * the business-layer resolver, not here.
 *
 * @param {PricingTypeFilters} [filters={}]
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingTypeFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };
  
  const { statusId, keyword } = normalizedFilters;
  
  // ─── Status ────────────────────────────────────────────────────────────────
  
  if (statusId) {
    conditions.push(`pt.status_id = $${paramIndexRef.value++}`);
    params.push(statusId);
  }
  
  // ─── Keyword ────────────────────────────────────────────────────────────────
  
  if (keyword) {
    const idx = paramIndexRef.value++;
    conditions.push(`(
      pt.name ILIKE $${idx} OR
      pt.code ILIKE $${idx}
    )`);
    params.push(`%${String(keyword).trim()}%`);
  }
  
  // ─── Audit ─────────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column: 'pt.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyAuditConditions(
    conditions,
    params,
    paramIndexRef,
    normalizedFilters,
    'pt'
  );
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildPricingTypeFilter,
};
