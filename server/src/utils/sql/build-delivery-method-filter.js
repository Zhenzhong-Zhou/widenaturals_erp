/**
 * @file build-delivery-method-filter.js
 * @description SQL WHERE clause builder for delivery method queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildDeliveryMethodFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for delivery method queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * `_activeStatusId` is a server-injected fallback — never from user input.
 * It enforces minimum status visibility when no explicit statusId filter is provided.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.methodName]         - Exact match on method name.
 * @param {boolean} [filters.isPickupLocation]   - Filter by pickup location flag.
 * @param {string}  [filters.createdBy]          - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]          - Filter by updater user UUID.
 * @param {string}  [filters.keyword]            - ILIKE search across method_name and description.
 * @param {string}  [filters.statusId]           - Filter by status UUID.
 * @param {string}  [filters._activeStatusId]    - Server-injected fallback status UUID.
 * @param {string}  [filters.createdAfter]       - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]      - Upper bound for created_at (exclusive, UTC).
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildDeliveryMethodFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    filters,
    'createdAfter',
    'createdBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  // ─── Core ────────────────────────────────────────────────────────────────────

  if (normalizedFilters.methodName) {
    conditions.push(`dm.method_name = $${paramIndexRef.value}`);
    params.push(normalizedFilters.methodName);
    paramIndexRef.value++;
  }

  if (normalizedFilters.isPickupLocation !== undefined) {
    conditions.push(`dm.is_pickup_location = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isPickupLocation);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`dm.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`dm.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Keyword (must remain last before status) ────────────────────────────────

  // Same $N referenced twice — single param covers both columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      dm.method_name  ILIKE $${paramIndexRef.value} OR
      dm.description  ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.statusId) {
    conditions.push(`dm.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  } else if (normalizedFilters._activeStatusId) {
    // Server-injected fallback — enforces minimum status visibility
    // when the caller provides no explicit statusId filter.
    conditions.push(`dm.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters._activeStatusId);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'dm.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildDeliveryMethodFilter,
};
