/**
 * @file order-fulfillment-queries.js
 * @description SQL query constants and factory functions for
 * order-fulfillment-repository.js.
 *
 * Exports:
 *  - ORDER_FULFILLMENT_INSERT_COLUMNS      — ordered column list for bulk insert
 *  - ORDER_FULFILLMENT_CONFLICT_COLUMNS    — upsert conflict target columns
 *  - ORDER_FULFILLMENT_UPDATE_STRATEGIES   — conflict update strategies
 *  - buildOrderFulfillmentQuery            — factory for fulfillment fetch query
 *  - ORDER_FULFILLMENT_UPDATE_STATUS_QUERY — update status by id array
 */

'use strict';

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertOrderFulfillmentsBulk row map.
const ORDER_FULFILLMENT_INSERT_COLUMNS = [
  'order_item_id',
  'allocation_id',
  'quantity_fulfilled',
  'status_id',
  'shipment_id',
  'fulfillment_notes',
  'updated_at',
  'fulfilled_by',
  'created_by',
  'updated_by',
];

// Conflict target: a fulfillment is considered duplicate when both match.
const ORDER_FULFILLMENT_CONFLICT_COLUMNS = ['order_item_id', 'shipment_id'];

const ORDER_FULFILLMENT_UPDATE_STRATEGIES = {
  quantity_fulfilled: 'add',
  status_id:          'overwrite',
  updated_at:         'overwrite',
  fulfillment_notes:  'merge_text',
  fulfilled_by:       'coalesce',
  updated_by:         'overwrite',
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildFulfillmentFilter.
 * @returns {string}
 */
const buildOrderFulfillmentQuery = (whereClause) => `
  SELECT
    f.id              AS fulfillment_id,
    oi.order_id,
    f.order_item_id,
    f.allocation_id,
    f.quantity_fulfilled,
    f.status_id,
    f.shipment_id
  FROM order_fulfillments f
  JOIN order_items oi ON f.order_item_id = oi.id
  WHERE ${whereClause}
  ORDER BY f.created_at ASC
`;

// ─── Update Status ────────────────────────────────────────────────────────────

// $1: status_id, $2: user_id, $3: fulfillment_ids (UUID array)
const ORDER_FULFILLMENT_UPDATE_STATUS_QUERY = `
  UPDATE order_fulfillments
  SET
    status_id    = $1,
    fulfilled_at = NOW(),
    updated_at   = NOW(),
    updated_by   = $2
  WHERE id = ANY($3::uuid[])
  RETURNING id
`;

module.exports = {
  ORDER_FULFILLMENT_INSERT_COLUMNS,
  ORDER_FULFILLMENT_CONFLICT_COLUMNS,
  ORDER_FULFILLMENT_UPDATE_STRATEGIES,
  buildOrderFulfillmentQuery,
  ORDER_FULFILLMENT_UPDATE_STATUS_QUERY,
};
