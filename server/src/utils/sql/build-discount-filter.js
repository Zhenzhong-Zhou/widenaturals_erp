/**
 * @file build-discount-filter.js
 * @description SQL WHERE clause builder for discount queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildDiscountFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for discount queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * `_restrictKeywordToValidOnly` is a server-injected flag — never from user input.
 * When true, restricts results to currently valid discounts regardless of other filters.
 *
 * `_activeStatusId` is a server-injected fallback — enforces minimum status
 * visibility when no explicit statusId filter is provided.
 *
 * `validOn` uses the same $N twice — a single param checks both valid_from
 * and valid_to boundaries for point-in-time validity.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.name]                        - Exact match on discount name.
 * @param {string}  [filters.discountType]                - Exact match on discount type.
 * @param {string}  [filters.validFrom]                   - Lower bound for valid_from (>=).
 * @param {string}  [filters.validTo]                     - Upper bound for valid_to (<=).
 * @param {string}  [filters.validOn]                     - Point-in-time validity check.
 * @param {string}  [filters.createdBy]                   - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]                   - Filter by updater user UUID.
 * @param {string}  [filters.keyword]                     - ILIKE search across name and description.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - Server-injected: restrict to currently valid discounts.
 * @param {string}  [filters.statusId]                    - Filter by status UUID.
 * @param {string}  [filters._activeStatusId]             - Server-injected fallback status UUID.
 * @param {string}  [filters.createdAfter]                - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]               - Upper bound for created_at (exclusive, UTC).
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildDiscountFilter = (filters = {}) => {
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

  if (normalizedFilters.name) {
    conditions.push(`d.name = $${paramIndexRef.value}`);
    params.push(normalizedFilters.name);
    paramIndexRef.value++;
  }

  if (normalizedFilters.discountType) {
    conditions.push(`d.discount_type = $${paramIndexRef.value}`);
    params.push(normalizedFilters.discountType);
    paramIndexRef.value++;
  }

  // ─── Validity Window ─────────────────────────────────────────────────────────

  if (normalizedFilters.validFrom) {
    conditions.push(`d.valid_from >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validFrom);
    paramIndexRef.value++;
  }

  if (normalizedFilters.validTo) {
    conditions.push(`d.valid_to <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validTo);
    paramIndexRef.value++;
  }

  if (normalizedFilters.validOn) {
    // Same $N referenced twice — single param checks both boundaries
    // for point-in-time validity: active on or after start, not yet expired.
    conditions.push(`(
      d.valid_from <= $${paramIndexRef.value} AND
      (d.valid_to IS NULL OR d.valid_to >= $${paramIndexRef.value})
    )`);
    params.push(normalizedFilters.validOn);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`d.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`d.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Keyword (must remain last before server flags) ──────────────────────────

  // Same $N referenced twice — single param covers both columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      d.name        ILIKE $${paramIndexRef.value} OR
      d.description ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }

  // ─── Server-Injected Flags ───────────────────────────────────────────────────

  if (normalizedFilters._restrictKeywordToValidOnly) {
    // No params — hardcoded NOW() sentinel enforces current validity window.
    conditions.push(`d.valid_from <= NOW()`);
    conditions.push(`(d.valid_to IS NULL OR d.valid_to >= NOW())`);
  }

  if (normalizedFilters.statusId) {
    conditions.push(`d.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  } else if (normalizedFilters._activeStatusId) {
    // Server-injected fallback — enforces minimum status visibility
    // when the caller provides no explicit statusId filter.
    conditions.push(`d.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters._activeStatusId);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'd.created_at',
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
  buildDiscountFilter,
};
