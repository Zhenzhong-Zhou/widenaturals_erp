/**
 * @file build-product-filter.js
 * @description SQL WHERE clause builder for product queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildProductFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyProductFieldConditions } = require('./build-product-base-filter');
const { applyAuditConditions } = require('./build-audit-filter');

/**
 * Builds a parameterised SQL WHERE clause for product queries.
 *
 * Status resolution priority:
 *  1. statusIds (array)  — explicit multi-status filter
 *  2. status_id (scalar) — explicit single-status filter
 *  3. _activeStatusId    — server-injected fallback
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.statusIds]       - Filter by status UUIDs (array takes priority).
 * @param {string}   [filters.status_id]       - Filter by status UUID (scalar fallback).
 * @param {string}   [filters._activeStatusId] - Server-injected status fallback.
 * @param {string}   [filters.brand]           - ILIKE filter on brand.
 * @param {string}   [filters.category]        - ILIKE filter on category.
 * @param {string}   [filters.series]          - ILIKE filter on series.
 * @param {string}   [filters.createdBy]       - Filter by creator UUID.
 * @param {string}   [filters.updatedBy]       - Filter by updater UUID.
 * @param {string}   [filters.createdAfter]    - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]   - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.keyword]         - ILIKE search across name, brand, category.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildProductFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters, 'createdAfter', 'createdBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  const statusFilterValue =
    normalizedFilters.statusIds?.length ? normalizedFilters.statusIds  :
      normalizedFilters.status_id         ? normalizedFilters.status_id  :
        normalizedFilters._activeStatusId;
  
  if (statusFilterValue != null) {
    conditions.push(
      Array.isArray(statusFilterValue)
        ? `p.status_id = ANY($${paramIndexRef.value}::uuid[])`
        : `p.status_id = $${paramIndexRef.value}`
    );
    params.push(statusFilterValue);
    paramIndexRef.value++;
  }
  
  // ─── Brand / Category / Series ───────────────────────────────────────────────
  
  applyProductFieldConditions(conditions, params, paramIndexRef, normalizedFilters);
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  applyAuditConditions(conditions, params, paramIndexRef, normalizedFilters, 'p');
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        'p.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced three times — single param covers all columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      p.name     ILIKE $${paramIndexRef.value} OR
      p.brand    ILIKE $${paramIndexRef.value} OR
      p.category ILIKE $${paramIndexRef.value}
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
  buildProductFilter,
};
