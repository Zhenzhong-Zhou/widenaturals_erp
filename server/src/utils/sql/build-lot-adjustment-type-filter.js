/**
 * @file build-lot-adjustment-type-filter.js
 * @description SQL WHERE clause builder for lot adjustment type queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * References the joined `inventory_action_types iat` alias for
 * action-type-category restrictions — callers must include the join in
 * the SELECT and supply it to the pagination helper for COUNT generation.
 *
 * Exports:
 *  - buildLotAdjustmentTypeFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for lot adjustment type queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * Business rule notes:
 *  - The previous `restrictToQtyAdjustment` flag is now expressed as
 *    `actionTypeCategories: ['adjustment']`.
 *  - The previous `excludeInternal` flag is now expressed as
 *    `excludeNames: ['manual_stock_insert', 'manual_stock_update']`.
 *  - `isActive` is a generic filter; the business layer should pass `true`
 *    for user-facing lookups to keep inactive types hidden.
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.ids]                   - Filter by lot adjustment type UUIDs.
 * @param {boolean}  [filters.isActive]              - Filter by active flag.
 * @param {string}   [filters.inventoryActionTypeId] - Filter by parent inventory action type UUID.
 * @param {string[]} [filters.actionTypeCategories]  - Filter by parent action type category (e.g. ['adjustment']).
 * @param {string[]} [filters.excludeNames]          - Exclude lot adjustment type names (e.g. internal stock management).
 * @param {string}   [filters.group]                 - Filter by group label.
 * @param {string}   [filters.departmentGroup]       - Filter by department group label.
 * @param {string}   [filters.createdBy]             - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]             - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]          - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]         - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]          - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]         - Upper bound for updated_at (exclusive, UTC).
 * @param {string}   [filters.name]                  - ILIKE filter on lat.name.
 * @param {string}   [filters.code]                  - ILIKE filter on lat.code.
 * @param {string}   [filters.description]           - ILIKE filter on lat.description.
 * @param {string}   [filters.keyword]               - Fuzzy search across name, code, and description.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildLotAdjustmentTypeFilter = (filters = {}) => {
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
    conditions.push(`lat.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.ids);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.isActive !== undefined) {
    conditions.push(`lat.is_active = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isActive);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.inventoryActionTypeId) {
    conditions.push(`lat.inventory_action_type_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.inventoryActionTypeId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.actionTypeCategories?.length) {
    conditions.push(`iat.category = ANY($${paramIndexRef.value}::text[])`);
    params.push(normalizedFilters.actionTypeCategories);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.excludeNames?.length) {
    conditions.push(`lat.name <> ALL($${paramIndexRef.value}::text[])`);
    params.push(normalizedFilters.excludeNames);
    paramIndexRef.value++;
  }
  
  // ─── Grouping ───────────────────────────────────────────────────────────────
  
  // `group` is a Postgres reserved word — must be quoted even when alias-prefixed.
  if (normalizedFilters.group) {
    conditions.push(`lat."group" = $${paramIndexRef.value}`);
    params.push(normalizedFilters.group);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.departmentGroup) {
    conditions.push(`lat.department_group = $${paramIndexRef.value}`);
    params.push(normalizedFilters.departmentGroup);
    paramIndexRef.value++;
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`lat.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`lat.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column: 'lat.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column: 'lat.updated_at',
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
    'lat.name'
  );
  
  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.code,
    'lat.code'
  );
  
  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.description,
    'lat.description'
  );
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    conditions.push(`(
      lat.name        ILIKE $${paramIndexRef.value} OR
      lat.code        ILIKE $${paramIndexRef.value} OR
      lat.description ILIKE $${paramIndexRef.value}
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
  buildLotAdjustmentTypeFilter,
};
