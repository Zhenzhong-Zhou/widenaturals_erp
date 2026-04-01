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

/**
 * Builds a parameterised SQL WHERE clause for pricing type queries.
 *
 * `canViewAllStatuses` controls whether the status filter is enforced:
 *  - false (default) → statusId is always applied
 *  - true + no statusId → no status condition applied
 *  - true + statusId → statusId is still applied
 *
 * startDate/endDate apply a BETWEEN range on pt.status_date.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.statusId]              - Filter by status UUID.
 * @param {boolean} [filters.canViewAllStatuses]    - If true, status filter is optional.
 * @param {string}  [filters.search]                - ILIKE search across name and code.
 * @param {string}  [filters.startDate]             - Lower bound for status_date (BETWEEN).
 * @param {string}  [filters.endDate]               - Upper bound for status_date (BETWEEN).
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPricingTypeFilter = (filters = {}) => {
  const conditions    = [];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  const {
    statusId,
    canViewAllStatuses = false,
    search,
    startDate,
    endDate,
  } = filters;
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  // Apply status filter when: caller cannot view all statuses, OR
  // caller can but has also specified an explicit statusId.
  if (!canViewAllStatuses || (canViewAllStatuses && statusId)) {
    conditions.push(`pt.status_id = $${paramIndexRef.value}`);
    params.push(statusId);
    paramIndexRef.value++;
  }
  
  // ─── Search ──────────────────────────────────────────────────────────────────
  
  // Same $N referenced twice — single param covers both columns.
  // LOWER() applied for case-insensitive matching without ILIKE.
  if (search) {
    conditions.push(
      `(LOWER(pt.name) ILIKE $${paramIndexRef.value} OR LOWER(pt.code) ILIKE $${paramIndexRef.value})`
    );
    params.push(`%${search.toLowerCase()}%`);
    paramIndexRef.value++;
  }
  
  // ─── Status Date Range ───────────────────────────────────────────────────────
  
  if (startDate && endDate) {
    conditions.push(
      `pt.status_date BETWEEN $${paramIndexRef.value} AND $${paramIndexRef.value + 1}`
    );
    params.push(startDate, endDate);
    paramIndexRef.value += 2;
  }
  
  return {
    whereClause: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params,
  };
};

module.exports = {
  buildPricingTypeFilter,
};
