/**
 * @file build-order-fulfillment-filter.js
 * @description SQL WHERE clause builder for order fulfillment queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildFulfillmentFilter
 */

'use strict';

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for order fulfillment queries.
 *
 * Both fulfillmentIds and allocationIds accept scalar or array values —
 * scalars are wrapped in an array to use the consistent ANY($n::uuid[]) pattern.
 *
 * @param {Object}          [filters={}]
 * @param {string}          [filters.orderId]        - Filter by order UUID.
 * @param {string|string[]} [filters.fulfillmentIds] - Filter by fulfillment UUID(s).
 * @param {string|string[]} [filters.allocationIds]  - Filter by allocation UUID(s).
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildFulfillmentFilter = (filters = {}) => {
  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };

  if (filters.orderId) {
    conditions.push(`oi.order_id = $${paramIndexRef.value}`);
    params.push(filters.orderId);
    paramIndexRef.value++;
  }

  if (filters.fulfillmentIds) {
    // Scalar wrapped in array for consistent ANY pattern.
    const ids = Array.isArray(filters.fulfillmentIds)
      ? filters.fulfillmentIds
      : [filters.fulfillmentIds];
    conditions.push(`f.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(ids);
    paramIndexRef.value++;
  }

  if (filters.allocationIds) {
    // Scalar wrapped in array for consistent ANY pattern.
    const ids = Array.isArray(filters.allocationIds)
      ? filters.allocationIds
      : [filters.allocationIds];
    conditions.push(`f.allocation_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(ids);
    paramIndexRef.value++;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildFulfillmentFilter,
};
