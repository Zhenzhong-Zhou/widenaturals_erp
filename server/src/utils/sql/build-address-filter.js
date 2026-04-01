/**
 * @file build-address-filter.js
 * @description SQL WHERE clause builder for address queries.
 *
 * Constructs a parameterised WHERE clause and bound params array from
 * a validated filter object. Designed to be called from address-repository.js
 * after Joi middleware has already validated the request inputs.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildAddressFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for address queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 * When `includeUnassigned` is true and `customerId` is present, appends an
 * OR customer_id IS NULL clause to surface orphan addresses alongside the
 * customer's own records.
 *
 * Always starts with `1=1` so the clause is safe to append directly after WHERE
 * even when no filters are active.
 *
 * @param {Object}  [filters={}]                   - Validated filter fields from the request.
 * @param {string}  [filters.customerId]            - Filter by owning customer UUID.
 * @param {string}  [filters.createdBy]             - Filter by creator user UUID.
 * @param {string}  [filters.updatedBy]             - Filter by updater user UUID.
 * @param {string}  [filters.region]                - Filter by region string.
 * @param {string}  [filters.country]               - Filter by country string.
 * @param {string}  [filters.keyword]               - ILIKE search across label, full_name, email, phone, city.
 * @param {string}  [filters.createdAfter]          - Lower bound for created_at (inclusive, normalized to UTC).
 * @param {string}  [filters.createdBefore]         - Upper bound for created_at (exclusive, normalized to UTC).
 * @param {string}  [filters.updatedAfter]          - Lower bound for updated_at (inclusive, normalized to UTC).
 * @param {string}  [filters.updatedBefore]         - Upper bound for updated_at (exclusive, normalized to UTC).
 * @param {boolean} [includeUnassigned=false]        - If true, also include addresses where customer_id IS NULL.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildAddressFilter = (filters = {}, includeUnassigned = false) => {
  // Normalize date ranges into UTC ISO boundaries before building conditions.
  // Reassigned to a new object — original filters reference is not mutated.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions  = ['1=1'];
  const params      = [];
  const paramIndexRef = { value: 1 };
  
  if (normalizedFilters.customerId) {
    if (includeUnassigned) {
      // Surface both the customer's own addresses and any orphan addresses.
      conditions.push(
        `(a.customer_id = $${paramIndexRef.value} OR a.customer_id IS NULL)`
      );
    } else {
      conditions.push(`a.customer_id = $${paramIndexRef.value}`);
    }
    params.push(normalizedFilters.customerId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.createdBy) {
    conditions.push(`a.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`a.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.region) {
    conditions.push(`a.region = $${paramIndexRef.value}`);
    params.push(normalizedFilters.region);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.country) {
    conditions.push(`a.country = $${paramIndexRef.value}`);
    params.push(normalizedFilters.country);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.keyword) {
    // Same $N index is intentionally repeated across all five columns —
    // PostgreSQL allows a single bound parameter to be referenced multiple
    // times in the same query. Only one entry is pushed to params.
    conditions.push(`(
      a.label     ILIKE $${paramIndexRef.value} OR
      a.full_name ILIKE $${paramIndexRef.value} OR
      a.email     ILIKE $${paramIndexRef.value} OR
      a.phone     ILIKE $${paramIndexRef.value} OR
      a.city      ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'a.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'a.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildAddressFilter,
};
