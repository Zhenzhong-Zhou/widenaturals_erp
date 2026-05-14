/**
 * @file build-inventory-action-type-filter.js
 * @description SQL WHERE clause builder for inventory action type queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildInventoryActionTypeFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for inventory action type queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * `addIlikeFilter` differs from `addKeywordIlikeGroup` — it returns the updated
 * param index rather than advancing it internally, so paramIndexRef.value must
 * be explicitly reassigned after each call.
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.ids]               - Filter by action type UUIDs.
 * @param {string[]} [filters.categories]        - Filter by category (e.g. 'adjustment', 'transaction', 'system').
 * @param {boolean}  [filters.isAdjustment]      - Filter by adjustment flag.
 * @param {boolean}  [filters.affectsFinancials] - Filter by financial impact flag.
 * @param {boolean}  [filters.requiresAudit]     - Filter by audit requirement flag.
 * @param {boolean}  [filters.defaultAction]     - Filter by default action flag (non-deletable system actions).
 * @param {string}   [filters.statusId]          - Filter by status UUID.
 * @param {string}   [filters.createdBy]         - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]         - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]      - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]     - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]      - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]     - Upper bound for updated_at (exclusive, UTC).
 * @param {string}   [filters.name]              - ILIKE filter on iat.name.
 * @param {string}   [filters.description]       - ILIKE filter on iat.description.
 * @param {string}   [filters.keyword]           - Fuzzy search across name and description.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildInventoryActionTypeFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  // ─── Identity ───────────────────────────────────────────────────────────────

  if (normalizedFilters.ids?.length) {
    conditions.push(`iat.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.ids);
    paramIndexRef.value++;
  }

  if (normalizedFilters.categories?.length) {
    conditions.push(`iat.category = ANY($${paramIndexRef.value}::text[])`);
    params.push(normalizedFilters.categories);
    paramIndexRef.value++;
  }

  if (normalizedFilters.statusId) {
    conditions.push(`iat.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  }

  // ─── Behavior Flags ─────────────────────────────────────────────────────────

  if (normalizedFilters.isAdjustment !== undefined) {
    conditions.push(`iat.is_adjustment = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isAdjustment);
    paramIndexRef.value++;
  }

  if (normalizedFilters.affectsFinancials !== undefined) {
    conditions.push(`iat.affects_financials = $${paramIndexRef.value}`);
    params.push(normalizedFilters.affectsFinancials);
    paramIndexRef.value++;
  }

  if (normalizedFilters.requiresAudit !== undefined) {
    conditions.push(`iat.requires_audit = $${paramIndexRef.value}`);
    params.push(normalizedFilters.requiresAudit);
    paramIndexRef.value++;
  }

  if (normalizedFilters.defaultAction !== undefined) {
    conditions.push(`iat.default_action = $${paramIndexRef.value}`);
    params.push(normalizedFilters.defaultAction);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`iat.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`iat.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'iat.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'iat.updated_at',
    after: normalizedFilters.updatedAfter,
    before: normalizedFilters.updatedBefore,
    paramIndexRef,
  });

  // ─── Text ───────────────────────────────────────────────────────────────────

  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.name,
    'iat.name'
  );

  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.description,
    'iat.description'
  );

  // ─── Keyword (must remain last) ──────────────────────────────────────────────

  if (normalizedFilters.keyword) {
    conditions.push(`(
      iat.name        ILIKE $${paramIndexRef.value} OR
      iat.description ILIKE $${paramIndexRef.value}
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
  buildInventoryActionTypeFilter,
};
