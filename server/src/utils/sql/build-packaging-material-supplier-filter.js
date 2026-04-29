/**
 * @file build-packaging-material-supplier-filter.js
 * @description SQL WHERE clause builder for packaging material supplier queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildPackagingMaterialSupplierFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');

/**
 * Builds a parameterised SQL WHERE clause for packaging material supplier queries.
 *
 * Unarchived suppliers are excluded by default.
 * enforceActiveOnly restricts to activeStatusId when no explicit status filter is present.
 *
 * @param {Object}   [filters={}]
 * @param {boolean}  [filters.includeArchived]      - If true, include archived suppliers.
 * @param {boolean}  [filters.enforceActiveOnly]    - If true, restrict to activeStatusId.
 * @param {string}   [filters.activeStatusId]       - Server-injected active status UUID.
 * @param {string[]} [filters.ids]                  - Filter by pms UUIDs.
 * @param {string}   [filters.packagingMaterialId]  - Filter by packaging material UUID.
 * @param {string}   [filters.supplierId]           - Filter by supplier UUID.
 * @param {boolean}  [filters.isPreferred]          - Filter by preferred supplier flag.
 * @param {number}   [filters.minCost]              - Minimum contract_unit_cost.
 * @param {number}   [filters.maxCost]              - Maximum contract_unit_cost.
 * @param {string}   [filters.currency]             - Filter by currency code.
 * @param {string}   [filters.note]                 - ILIKE filter on pms.note.
 * @param {string}   [filters.keyword]              - Fuzzy search across supplier name, code, note.
 * @param {string}   [filters.createdBy]            - Filter by creator UUID.
 * @param {string}   [filters.updatedBy]            - Filter by updater UUID.
 * @param {string}   [filters.createdAfter]         - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]        - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]         - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]        - Upper bound for updated_at (exclusive, UTC).
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPackagingMaterialSupplierFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  const includeArchived = normalizedFilters.includeArchived === true;
  const enforceActiveOnly = normalizedFilters.enforceActiveOnly === true;

  // ─── Archive / Status ────────────────────────────────────────────────────────

  if (!includeArchived) {
    conditions.push(`s.is_archived = FALSE`);
  }

  if (enforceActiveOnly && normalizedFilters.activeStatusId) {
    conditions.push(`s.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.activeStatusId);
    paramIndexRef.value++;
  }

  // ─── Relationship ────────────────────────────────────────────────────────────

  if (normalizedFilters.ids?.length) {
    conditions.push(`pms.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.ids);
    paramIndexRef.value++;
  }

  if (normalizedFilters.packagingMaterialId) {
    conditions.push(`pms.packaging_material_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.packagingMaterialId);
    paramIndexRef.value++;
  }

  if (normalizedFilters.supplierId) {
    conditions.push(`pms.supplier_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.supplierId);
    paramIndexRef.value++;
  }

  if (normalizedFilters.isPreferred !== undefined) {
    conditions.push(`pms.is_preferred = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isPreferred);
    paramIndexRef.value++;
  }

  // ─── Pricing ─────────────────────────────────────────────────────────────────

  if (normalizedFilters.minCost !== undefined) {
    conditions.push(`pms.contract_unit_cost >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.minCost);
    paramIndexRef.value++;
  }

  if (normalizedFilters.maxCost !== undefined) {
    conditions.push(`pms.contract_unit_cost <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.maxCost);
    paramIndexRef.value++;
  }

  if (normalizedFilters.currency) {
    conditions.push(`pms.currency = $${paramIndexRef.value}`);
    params.push(normalizedFilters.currency);
    paramIndexRef.value++;
  }

  // ─── Text ────────────────────────────────────────────────────────────────────

  paramIndexRef.value = addIlikeFilter(
    conditions,
    params,
    paramIndexRef.value,
    normalizedFilters.note,
    'pms.note'
  );

  // ─── Keyword (must remain last before audit) ─────────────────────────────────

  // Same $N referenced three times — single param covers all columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      s.name   ILIKE $${paramIndexRef.value} OR
      s.code   ILIKE $${paramIndexRef.value} OR
      pms.note ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`pms.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`pms.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'pms.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'pms.updated_at',
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
  buildPackagingMaterialSupplierFilter,
};
