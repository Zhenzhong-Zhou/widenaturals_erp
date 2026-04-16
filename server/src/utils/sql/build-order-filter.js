/**
 * @file build-order-filter.js
 * @description SQL WHERE clause builder for order queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildOrderFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds a parameterised SQL WHERE clause for order queries.
 *
 * Status resolution priority:
 *  1. _activeStatusId — server-injected enforcement (takes priority over user input)
 *  2. orderStatusId   — explicit single status filter
 *  3. orderStatusIds  — explicit multi-status filter (separate block, not a fallback)
 *
 * `_restrictKeywordToOrderNumberOnly` limits keyword search to order_number only —
 * used when the caller wants precise order lookup without note matching.
 *
 * @param {Object}          [filters={}]
 * @param {string}          [filters.orderNumber]                    - ILIKE filter on order number.
 * @param {string|string[]} [filters.orderTypeId]                    - Filter by order type UUID(s).
 * @param {string}          [filters.customerType]                   - Filter by customer type ('individual' or 'company').
 * @param {string} [filters.customerName]                            - ILIKE filter across firstname, lastname, and company_name.
 * @param {string}          [filters._activeStatusId]                - Server-injected status enforcement.
 * @param {string}          [filters.orderStatusId]                  - Filter by single status UUID.
 * @param {string|string[]} [filters.orderStatusIds]                 - Filter by multiple status UUIDs.
 * @param {string}          [filters.createdBy]                      - Filter by creator UUID.
 * @param {string}          [filters.updatedBy]                      - Filter by updater UUID.
 * @param {string}          [filters.createdAfter]                   - Lower bound for created_at (inclusive, UTC).
 * @param {string}          [filters.createdBefore]                  - Upper bound for created_at (exclusive, UTC).
 * @param {string}          [filters.statusAfter]                    - Lower bound for status_date (inclusive, UTC).
 * @param {string}          [filters.statusBefore]                   - Upper bound for status_date (exclusive, UTC).
 * @param {string}          [filters.keyword]                        - Fuzzy search across order_number and note.
 * @param {boolean}         [filters._restrictKeywordToOrderNumberOnly] - If true, limits keyword to order_number only.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildOrderFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'statusAfter',
    'statusBefore'
  );

  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  // ─── Order Number ────────────────────────────────────────────────────────────

  if (normalizedFilters.orderNumber) {
    conditions.push(`o.order_number ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.orderNumber}%`);
    paramIndexRef.value++;
  }

  // ─── Order Type ──────────────────────────────────────────────────────────────

  if (normalizedFilters.orderTypeId) {
    // Scalar wrapped in array for consistent ANY pattern.
    const ids = Array.isArray(normalizedFilters.orderTypeId)
      ? normalizedFilters.orderTypeId
      : [normalizedFilters.orderTypeId];
    conditions.push(`o.order_type_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(ids);
    paramIndexRef.value++;
  }

  // ─── Customer Type ───────────────────────────────────────────────────────────

  if (normalizedFilters.customerType) {
    conditions.push(`c.customer_type = $${paramIndexRef.value}`);
    params.push(normalizedFilters.customerType);
    paramIndexRef.value++;
  }

  // ─── Customer Name ───────────────────────────────────────────────────────────

  if (normalizedFilters.customerName) {
    const kw = `%${normalizedFilters.customerName.trim().replace(/\s+/g, ' ')}%`;
    conditions.push(`(
    c.firstname    ILIKE $${paramIndexRef.value} OR
    c.lastname     ILIKE $${paramIndexRef.value} OR
    c.company_name ILIKE $${paramIndexRef.value}
  )`);
    params.push(kw);
    paramIndexRef.value++;
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  // _activeStatusId takes priority — enforced by server, not user input.
  if (normalizedFilters._activeStatusId) {
    conditions.push(`o.order_status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters._activeStatusId);
    paramIndexRef.value++;
  } else if (normalizedFilters.orderStatusId) {
    conditions.push(`o.order_status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.orderStatusId);
    paramIndexRef.value++;
  }

  if (normalizedFilters.orderStatusIds != null) {
    const ids = Array.isArray(normalizedFilters.orderStatusIds)
      ? normalizedFilters.orderStatusIds
      : [normalizedFilters.orderStatusIds];
    conditions.push(`o.order_status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(ids);
    paramIndexRef.value++;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  if (normalizedFilters.createdBy) {
    conditions.push(`o.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }

  if (normalizedFilters.updatedBy) {
    conditions.push(`o.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }

  // ─── Date Range ─────────────────────────────────────────────────────────────

  applyDateRangeConditions({
    conditions,
    params,
    column: 'o.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });

  applyDateRangeConditions({
    conditions,
    params,
    column: 'o.status_date',
    after: normalizedFilters.statusAfter,
    before: normalizedFilters.statusBefore,
    paramIndexRef,
  });

  // ─── Keyword (must remain last) ──────────────────────────────────────────────

  if (normalizedFilters.keyword) {
    // Collapse internal whitespace before wrapping — consistent with bom filter.
    const kw = `%${normalizedFilters.keyword.trim().replace(/\s+/g, ' ')}%`;

    if (normalizedFilters._restrictKeywordToOrderNumberOnly) {
      // No param shared — single field, no OR needed.
      conditions.push(`o.order_number ILIKE $${paramIndexRef.value}`);
    } else {
      // Same $N referenced twice — single param covers both fields.
      conditions.push(`(
        o.order_number ILIKE $${paramIndexRef.value} OR
        o.note         ILIKE $${paramIndexRef.value}
      )`);
    }

    params.push(kw);
    paramIndexRef.value++;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildOrderFilter,
};
