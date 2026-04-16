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
 * `canViewAllStatuses` controls whether the status filter is enforced:
 *  - false (default) → statusId is always applied
 *  - true + no statusId → no status condition applied
 *  - true + statusId → statusId is still applied
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.statusId]           - Filter by status UUID.
 * @param {boolean} [filters.canViewAllStatuses] - If true, status filter is optional.
 * @param {string}  [filters.search]             - ILIKE search across name and code.
 * @param {string}  [filters.createdAfter]       - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]      - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.createdBy]          - Filter by creator UUID.
 * @param {string}  [filters.updatedBy]          - Filter by updater UUID.
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingTypeFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters,
    'createdAfter',
    'createdBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  const { statusId, canViewAllStatuses = false, search } = normalizedFilters;

  // ─── Status ────────────────────────────────────────────────────────────────

  if (!canViewAllStatuses || (canViewAllStatuses && statusId)) {
    conditions.push(`pt.status_id = $${paramIndexRef.value++}`);
    params.push(statusId);
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  // Same $N referenced twice — single param covers both columns.
  if (search) {
    conditions.push(`(
      pt.name ILIKE $${paramIndexRef.value} OR
      pt.code ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${String(search).trim()}%`);
    paramIndexRef.value++;
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
