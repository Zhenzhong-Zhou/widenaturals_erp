/**
 * @file build-batch-status-filter.js
 * @description SQL WHERE clause builder for batch status queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildBatchStatusFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for batch status queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * `addIlikeFilter` differs from `addKeywordIlikeGroup` — it returns the updated
 * param index rather than advancing it internally, so paramIndexRef.value must
 * be explicitly reassigned after each call.
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.ids]              - Filter by batch status UUIDs.
 * @param {boolean}  [filters.isActive]         - Filter by active flag.
 * @param {string}   [filters.createdBy]        - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]        - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]     - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]    - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]     - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]    - Upper bound for updated_at (exclusive, UTC).
 * @param {string}   [filters.name]             - ILIKE filter on bs.name.
 * @param {string}   [filters.description]      - ILIKE filter on bs.description.
 * @param {string}   [filters.keyword]          - Fuzzy search across name and description.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildBatchStatusFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  // ─── Status ─────────────────────────────────────────────────────────────────

  if (normalizedFilters.ids?.length) {
    conditions.push(`bs.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.ids);
    paramIndexRef.value++;
  }

  if (normalizedFilters.isActive !== undefined) {
    conditions.push(`bs.is_active = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isActive);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`bs.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`bs.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'bs.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'bs.updated_at',
    after: normalizedFilters.updatedAfter,
    before: normalizedFilters.updatedBefore,
    paramIndexRef,
  });

  // ─── Text ────────────────────────────────────────────────────────────────────

  // addIlikeFilter returns the next available param index — must be explicitly
  // reassigned after each call unlike addKeywordIlikeGroup which owns its index.
  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.name,
    'bs.name'
  );

  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.description,
    'bs.description'
  );

  // ─── Keyword (must remain last) ──────────────────────────────────────────────

  // Same $N referenced twice — single param covers both columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      bs.name        ILIKE $${paramIndexRef.value} OR
      bs.description ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildBatchStatusFilter,
};
