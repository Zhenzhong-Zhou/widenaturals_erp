/**
 * @file build-tax-rate-filter.js
 * @description SQL WHERE clause builder for tax rate queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildTaxRateFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for tax rate queries.
 *
 * Normalizes created date range filters to UTC ISO boundaries before applying
 * conditions. Validity window filters (validFrom, validTo, validOn) are
 * business timestamps and are intentionally not normalized.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.name]                      - Exact match on tax rate name.
 * @param {string}  [filters.region]                    - Exact match on region.
 * @param {string}  [filters.province]                  - Exact match on province.
 * @param {boolean} [filters.isActive]                  - Exact match on active flag.
 * @param {string}  [filters.createdBy]                 - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]                 - Filter by updater user UUID.
 * @param {string}  [filters.keyword]                   - Fuzzy search across name and province.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - If true, restricts keyword results to currently valid active rates.
 * @param {string}  [filters.validFrom]                 - Lower bound for valid_from (business timestamp, not normalized).
 * @param {string}  [filters.validTo]                   - Upper bound for valid_to (business timestamp, not normalized).
 * @param {string}  [filters.validOn]                   - Point-in-time validity check across valid_from and valid_to.
 * @param {string}  [filters.createdAfter]              - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]             - Upper bound for created_at (exclusive, UTC).
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildTaxRateFilter = (filters = {}) => {
  // Normalize created date range into UTC ISO boundaries — handles both raw
  // date strings and Date objects coerced by Joi's date() type.
  // Validity window filters are intentionally excluded — they are business
  // timestamps set by the user, not audit timestamps.
  const normalizedFilters = normalizeDateRangeFilters(
    filters,
    'createdAfter',
    'createdBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Exact-match filters ──────────────────────────────────────────────────────
  
  if (normalizedFilters.name) {
    conditions.push(`tr.name = $${paramIndexRef.value}`);
    params.push(normalizedFilters.name);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.region) {
    conditions.push(`tr.region = $${paramIndexRef.value}`);
    params.push(normalizedFilters.region);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.province) {
    conditions.push(`tr.province = $${paramIndexRef.value}`);
    params.push(normalizedFilters.province);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.isActive !== undefined) {
    conditions.push(`tr.is_active = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isActive);
    paramIndexRef.value++;
  }
  
  // ─── Audit filters ────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`tr.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`tr.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Keyword search ───────────────────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    const keywordConditions = [
      `(tr.name ILIKE $${paramIndexRef.value} OR tr.province ILIKE $${paramIndexRef.value})`,
    ];
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
    
    if (normalizedFilters._restrictKeywordToValidOnly) {
      // Hardcoded sentinels — no params needed.
      keywordConditions.push(`tr.valid_from <= NOW()`);
      keywordConditions.push(`(tr.valid_to IS NULL OR tr.valid_to >= NOW())`);
      keywordConditions.push(`tr.is_active = TRUE`);
    } else if (normalizedFilters.isActive !== undefined) {
      keywordConditions.push(`tr.is_active = $${paramIndexRef.value}`);
      params.push(normalizedFilters.isActive);
      paramIndexRef.value++;
    }
    
    conditions.push(`(${keywordConditions.join(' AND ')})`);
  }
  
  // ─── Validity window filters (business timestamps — not normalized) ───────────
  
  if (normalizedFilters.validFrom) {
    conditions.push(`tr.valid_from >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validFrom);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.validTo) {
    conditions.push(`tr.valid_to <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validTo);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.validOn) {
    // Same $N referenced twice — single param covers both sides of the window.
    conditions.push(`(
      tr.valid_from <= $${paramIndexRef.value} AND
      (tr.valid_to IS NULL OR tr.valid_to >= $${paramIndexRef.value})
    )`);
    params.push(normalizedFilters.validOn);
    paramIndexRef.value++;
  }
  
  // ─── Created date range ───────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'tr.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildTaxRateFilter,
};
