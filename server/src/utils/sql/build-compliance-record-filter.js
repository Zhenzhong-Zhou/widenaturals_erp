/**
 * @file build-compliance-record-filter.js
 * @description SQL WHERE clause builder for compliance record queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildComplianceRecordFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyProductFieldConditions } = require('./build-product-base-filter');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for compliance record queries.
 *
 * Normalizes all date range filters to UTC ISO boundaries before applying conditions.
 *
 * @param {Object}   [filters={}]
 * @param {string}   [filters.type]              - Exact match on compliance type.
 * @param {string[]} [filters.statusIds]          - Filter by compliance status UUIDs.
 * @param {string}   [filters.complianceId]       - ILIKE filter on compliance document number.
 * @param {string}   [filters.issuedAfter]        - Lower bound for issued_date (inclusive, UTC).
 * @param {string}   [filters.issuedBefore]       - Upper bound for issued_date (exclusive, UTC).
 * @param {string}   [filters.expiringAfter]      - Lower bound for expiry_date (inclusive, UTC).
 * @param {string}   [filters.expiringBefore]     - Upper bound for expiry_date (exclusive, UTC).
 * @param {string}   [filters.createdBy]          - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]          - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]       - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]      - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]       - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]      - Upper bound for updated_at (exclusive, UTC).
 * @param {string[]} [filters.skuIds]             - Filter by SKU UUIDs.
 * @param {string}   [filters.sku]                - ILIKE filter on SKU code.
 * @param {string}   [filters.sizeLabel]          - ILIKE filter on SKU size label.
 * @param {string}   [filters.marketRegion]       - ILIKE filter on SKU market region.
 * @param {string}   [filters.productName]        - ILIKE filter on product name.
 * @param {string}   [filters.brand]              - ILIKE filter on product brand.
 * @param {string}   [filters.category]           - ILIKE filter on product category.
 * @param {string}   [filters.keyword]            - Fuzzy search across compliance_id, sku, product name, brand, category.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildComplianceRecordFilter = (filters = {}) => {
  // Normalize all date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(
      normalizeDateRangeFilters(
        normalizeDateRangeFilters(filters, 'issuedAfter', 'issuedBefore'),
        'expiringAfter', 'expiringBefore'
      ),
      'createdAfter', 'createdBefore'
    ),
    'updatedAfter', 'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Compliance ──────────────────────────────────────────────────────────────
  
  if (normalizedFilters.type) {
    conditions.push(`cr.type = $${paramIndexRef.value}`);
    params.push(normalizedFilters.type);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`cr.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.complianceId) {
    conditions.push(`cr.compliance_id ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.complianceId}%`);
    paramIndexRef.value++;
  }
  
  // ─── Compliance Dates ────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'cr.issued_date',
    after:         normalizedFilters.issuedAfter,
    before:        normalizedFilters.issuedBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'cr.expiry_date',
    after:         normalizedFilters.expiringAfter,
    before:        normalizedFilters.expiringBefore,
    paramIndexRef,
  });
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`cr.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`cr.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Audit Dates ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'cr.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'cr.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── SKU ─────────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.skuIds?.length) {
    conditions.push(`s.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.skuIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.sku) {
    conditions.push(`s.sku ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.sku}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.sizeLabel) {
    conditions.push(`s.size_label ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.sizeLabel}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.marketRegion) {
    conditions.push(`s.market_region ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.marketRegion}%`);
    paramIndexRef.value++;
  }
  
  // ─── Product ─────────────────────────────────────────────────────────────────
  
  applyProductFieldConditions(conditions, params, paramIndexRef, normalizedFilters);
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced five times — single param covers all columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      cr.compliance_id ILIKE $${paramIndexRef.value} OR
      s.sku            ILIKE $${paramIndexRef.value} OR
      p.name           ILIKE $${paramIndexRef.value} OR
      p.brand          ILIKE $${paramIndexRef.value} OR
      p.category       ILIKE $${paramIndexRef.value}
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
  buildComplianceRecordFilter,
};
