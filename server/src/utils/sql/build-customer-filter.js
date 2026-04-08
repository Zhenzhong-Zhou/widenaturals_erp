/**
 * @file build-customer-filter.js
 * @description SQL WHERE clause builder for customer queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildCustomerFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for customer queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * The keyword block uses two separate params intentionally:
 *  - $n   → prefix match (firstname, lastname) — "starts with" for name typeahead
 *  - $n+1 → contains match (email, phone_number) — broader search for contact fields
 *
 * `_activeStatusId` is a server-injected fallback — never from user input.
 * It enforces a minimum status restriction when the user has no explicit statusId filter.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.createdBy]          - Filter by creator user UUID.
 * @param {string}  [filters.keyword]            - Typeahead search across name, email, phone.
 * @param {string}  [filters.statusId]           - Filter by customer status UUID.
 * @param {string}  [filters._activeStatusId]    - Server-injected fallback status UUID.
 * @param {string}  [filters.createdAfter]       - Lower bound for created_at (inclusive, UTC).
 * @param {string}  [filters.createdBefore]      - Upper bound for created_at (exclusive, UTC).
 * @param {string}  [filters.statusDateAfter]    - Lower bound for status_date (inclusive, UTC).
 * @param {string}  [filters.statusDateBefore]   - Upper bound for status_date (exclusive, UTC).
 * @param {boolean} [filters.onlyWithAddress]    - true = must have address, false = must not have address.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildCustomerFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'statusDateAfter', 'statusDateBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Customer Type ───────────────────────────────────────────────────────────
  
  if (normalizedFilters.customerType) {
    conditions.push(`c.customer_type = $${paramIndexRef.value}`);
    params.push(normalizedFilters.customerType);
    paramIndexRef.value++;
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`c.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  // ─── Keyword ─────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    // Two params are used intentionally — name fields use prefix match for
    // typeahead UX, contact fields use contains match for broader lookup.
    // $n   = "keyword%" — firstname, lastname
    // $n+1 = "%keyword%" — email, phone_number
    conditions.push(`(
      c.firstname    ILIKE $${paramIndexRef.value} OR
      c.lastname     ILIKE $${paramIndexRef.value} OR
      c.company_name ILIKE $${paramIndexRef.value} OR
      c.email        ILIKE $${paramIndexRef.value + 1} OR
      c.phone_number ILIKE $${paramIndexRef.value + 1}
    )`);
    params.push(
      `${normalizedFilters.keyword}%`,   // prefix match
      `%${normalizedFilters.keyword}%`   // contains match
    );
    paramIndexRef.value += 2;
  }
  
  // ─── Status ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.statusId) {
    conditions.push(`c.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  } else if (normalizedFilters._activeStatusId) {
    // Server-injected fallback — enforces minimum status visibility
    // when the caller has no explicit statusId filter.
    conditions.push(`c.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters._activeStatusId);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'c.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'c.status_date',
    after:         normalizedFilters.statusDateAfter,
    before:        normalizedFilters.statusDateBefore,
    paramIndexRef,
  });
  
  // ─── Address Existence ───────────────────────────────────────────────────────
  
  // EXISTS/NOT EXISTS avoids row multiplication from customers with
  // multiple addresses — same pattern used in the paginated query itself.
  if (normalizedFilters.onlyWithAddress === true) {
    conditions.push(
      `EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id)`
    );
  } else if (normalizedFilters.onlyWithAddress === false) {
    conditions.push(
      `NOT EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id)`
    );
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildCustomerFilter,
};
