/**
 * @file build-payment-method-filter.js
 * @description SQL WHERE clause builder for payment method queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildPaymentMethodFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds a parameterised SQL WHERE clause for payment method queries.
 *
 * `_restrictKeywordToNameOnly` limits keyword search to pm.name only —
 * used when precise name lookup is needed without code/description matching.
 *
 * `_restrictToActiveOnly` is a server-injected flag — no param needed,
 * hardcoded sentinel enforces is_active = true regardless of user input.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.name]                     - Exact match on payment method name.
 * @param {string}  [filters.code]                     - Exact match on payment method code.
 * @param {string}  [filters.createdBy]                - Filter by creator UUID.
 * @param {string}  [filters.updatedBy]                - Filter by updater UUID.
 * @param {string}  [filters.keyword]                  - Fuzzy search across name, code, description.
 * @param {boolean} [filters._restrictKeywordToNameOnly] - If true, limits keyword to pm.name only.
 * @param {boolean} [filters._restrictToActiveOnly]    - Server-injected: restrict to is_active = true.
 * @param {boolean} [filters.isActive]                 - Filter by active flag (ignored if _restrictToActiveOnly).
 * @param {string}  [filters.createdAfter]             - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]            - Upper bound for created_at (exclusive, UTC).
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildPaymentMethodFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters, 'createdAfter', 'createdBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Exact Match ─────────────────────────────────────────────────────────────
  
  if (normalizedFilters.name) {
    conditions.push(`pm.name = $${paramIndexRef.value}`);
    params.push(normalizedFilters.name);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.code) {
    conditions.push(`pm.code = $${paramIndexRef.value}`);
    params.push(normalizedFilters.code);
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
  
  // ─── Keyword (must remain last before server flags) ──────────────────────────
  
  if (normalizedFilters.keyword) {
    const kw = `%${normalizedFilters.keyword.trim().replace(/\s+/g, ' ')}%`;
    
    if (normalizedFilters._restrictKeywordToNameOnly) {
      // No OR — single field, no repeated $N needed.
      conditions.push(`pm.name ILIKE $${paramIndexRef.value}`);
    } else {
      // Same $N referenced three times — single param covers all columns.
      conditions.push(`(
        pm.name        ILIKE $${paramIndexRef.value} OR
        pm.code        ILIKE $${paramIndexRef.value} OR
        pm.description ILIKE $${paramIndexRef.value}
      )`);
    }
    params.push(kw);
    paramIndexRef.value++;
  }
  
  // ─── Active / Visibility ─────────────────────────────────────────────────────
  
  if (normalizedFilters._restrictToActiveOnly === true) {
    // No param — server-injected sentinel, not user input.
    conditions.push(`pm.is_active = true`);
  } else if (normalizedFilters.isActive !== undefined) {
    conditions.push(`pm.is_active = $${paramIndexRef.value}`);
    params.push(normalizedFilters.isActive);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        'pm.created_at',
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
  buildPaymentMethodFilter,
};
