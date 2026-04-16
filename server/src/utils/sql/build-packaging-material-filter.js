/**
 * @file build-packaging-material-filter.js
 * @description SQL WHERE clause builder for packaging material queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildPackagingMaterialsFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds a parameterised SQL WHERE clause for packaging material queries.
 *
 * Unarchived records are excluded by default — pass restrictToUnarchived: false to include them.
 * Status resolution: statusId takes priority over _activeStatusId server fallback.
 *
 * @param {Object}  [filters={}]
 * @param {boolean} [filters.visibleOnly]           - If true, restricts to is_visible_for_sales_order = true.
 * @param {boolean} [filters.restrictToUnarchived]  - Defaults true — set false to include archived.
 * @param {string}  [filters.statusId]              - Explicit status UUID filter.
 * @param {string}  [filters._activeStatusId]       - Server-injected fallback status UUID.
 * @param {string}  [filters.keyword]               - ILIKE search across name, color, size, grade, composition.
 * @param {string}  [filters.createdBy]             - Filter by creator UUID.
 * @param {string}  [filters.updatedBy]             - Filter by updater UUID.
 * @param {string}  [filters.createdAfter]          - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]         - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.updatedAfter]          - Lower bound for updated_at (inclusive, UTC).
 * @param {string}  [filters.updatedBefore]         - Upper bound for updated_at (exclusive, UTC).
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPackagingMaterialsFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  // ─── Visibility ──────────────────────────────────────────────────────────────

  if (normalizedFilters.visibleOnly === true) {
    conditions.push(`pm.is_visible_for_sales_order = true`);
  }

  // Exclude archived by default — caller must explicitly opt out.
  if (normalizedFilters.restrictToUnarchived !== false) {
    conditions.push(`pm.is_archived = false`);
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.statusId) {
    conditions.push(`pm.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  } else if (normalizedFilters._activeStatusId) {
    conditions.push(`pm.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters._activeStatusId);
    paramIndexRef.value++;
  }

  // ─── Keyword (must remain last before audit) ─────────────────────────────────

  // Same $N referenced five times — single param covers all columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      pm.name                 ILIKE $${paramIndexRef.value} OR
      pm.color                ILIKE $${paramIndexRef.value} OR
      pm.size                 ILIKE $${paramIndexRef.value} OR
      pm.grade                ILIKE $${paramIndexRef.value} OR
      pm.material_composition ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`pm.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`pm.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'pm.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'pm.updated_at',
    after: normalizedFilters.updatedAfter,
    before: normalizedFilters.updatedBefore,
    paramIndexRef,
  });

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildPackagingMaterialsFilter,
};
