/**
 * @file build-bom-filter.js
 * @description SQL WHERE clause builder for BOM queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildBomFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for BOM queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * @param {Object}   [filters={}]
 * @param {string|string[]} [filters.skuId]              - Filter by SKU UUID(s).
 * @param {string|string[]} [filters.productId]          - Filter by product UUID(s).
 * @param {string}   [filters.productName]               - ILIKE filter on product name.
 * @param {string}   [filters.skuCode]                   - ILIKE filter on SKU code.
 * @param {string}   [filters.complianceType]            - ILIKE filter on compliance type.
 * @param {string}   [filters.complianceStatusId]        - Filter by compliance status UUID.
 * @param {boolean}  [filters.onlyActiveCompliance]      - If true, restricts to active compliance records.
 * @param {string}   [filters.complianceIssuedAfter]     - Lower bound for compliance issued_date (inclusive, UTC).
 * @param {string}   [filters.complianceExpiredBefore]   - Upper bound for compliance expiry_date (exclusive, UTC).
 * @param {string}   [filters.statusId]                  - Filter by BOM status UUID.
 * @param {boolean}  [filters.isActive]                  - Filter by BOM active flag.
 * @param {boolean}  [filters.isDefault]                 - Filter by BOM default flag.
 * @param {number}   [filters.revisionMin]               - Minimum BOM revision number (inclusive).
 * @param {number}   [filters.revisionMax]               - Maximum BOM revision number (inclusive).
 * @param {string}   [filters.createdBy]                 - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]                 - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]              - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]             - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.keyword]                   - Fuzzy search across bom name, code, description.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildBomFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(
      filters,
      'complianceIssuedAfter',
      'complianceExpiredBefore'
    ),
    'createdAfter',
    'createdBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  // ─── SKU / Product ───────────────────────────────────────────────────────────

  if (normalizedFilters.skuId) {
    if (Array.isArray(normalizedFilters.skuId)) {
      conditions.push(`b.sku_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(normalizedFilters.skuId);
    } else {
      conditions.push(`b.sku_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push([normalizedFilters.skuId]);
    }
    paramIndexRef.value++;
  }

  if (normalizedFilters.productId) {
    if (Array.isArray(normalizedFilters.productId)) {
      conditions.push(`p.id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(normalizedFilters.productId);
    } else {
      conditions.push(`p.id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push([normalizedFilters.productId]);
    }
    paramIndexRef.value++;
  }

  if (normalizedFilters.productName) {
    conditions.push(`p.name ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.productName}%`);
    paramIndexRef.value++;
  }

  if (normalizedFilters.skuCode) {
    conditions.push(`s.sku ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.skuCode}%`);
    paramIndexRef.value++;
  }

  // ─── Compliance ──────────────────────────────────────────────────────────────

  if (normalizedFilters.complianceType) {
    conditions.push(`cr.type ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.complianceType}%`);
    paramIndexRef.value++;
  }

  if (normalizedFilters.complianceStatusId) {
    conditions.push(`cr.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.complianceStatusId);
    paramIndexRef.value++;
  }

  if (normalizedFilters.onlyActiveCompliance === true) {
    // No param — hardcoded sentinel value, not user input.
    conditions.push(`LOWER(st_compliance.name) = 'active'`);
  }

  applyDateRangeConditions({
    conditions,
    params,
    column: 'cr.issued_date',
    after: normalizedFilters.complianceIssuedAfter,
    before: undefined,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'cr.expiry_date',
    after: undefined,
    before: normalizedFilters.complianceExpiredBefore,
    paramIndexRef,
  });

  // ─── BOM Status ──────────────────────────────────────────────────────────────

  if (normalizedFilters.statusId) {
    conditions.push(`b.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  }

  if (typeof normalizedFilters.isActive === 'boolean') {
    conditions.push(`b.is_active = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isActive);
    paramIndexRef.value++;
  }

  if (typeof normalizedFilters.isDefault === 'boolean') {
    conditions.push(`b.is_default = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isDefault);
    paramIndexRef.value++;
  }

  // ─── Revision Range ──────────────────────────────────────────────────────────

  if (normalizedFilters.revisionMin) {
    conditions.push(`b.revision >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.revisionMin);
    paramIndexRef.value++;
  }

  if (normalizedFilters.revisionMax) {
    conditions.push(`b.revision <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.revisionMax);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`b.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`b.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'b.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  // ─── Keyword (must remain last) ──────────────────────────────────────────────

  if (normalizedFilters.keyword) {
    // Collapse internal whitespace before wrapping — prevents double-space
    // literals from breaking ILIKE matches on normalized DB values.
    // Same $N referenced three times — single param covers all three columns.
    const kw = `%${normalizedFilters.keyword.trim().replace(/\s+/g, ' ')}%`;
    conditions.push(`(
      b.name        ILIKE $${paramIndexRef.value} OR
      b.code        ILIKE $${paramIndexRef.value} OR
      b.description ILIKE $${paramIndexRef.value}
    )`);
    params.push(kw);
    paramIndexRef.value++;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildBomFilter,
};
