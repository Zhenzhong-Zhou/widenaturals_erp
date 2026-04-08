/**
 * @file order-fulfillment-repository.js
 * @description Database access layer for order fulfillment records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from order-fulfillment-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertOrderFulfillmentsBulk    — bulk upsert with conflict resolution
 *  - getOrderFulfillments           — fetch fulfillments with dynamic filtering
 *  - updateOrderFulfillmentStatus   — bulk status update by fulfillment id array
 */

'use strict';

const { bulkInsert } = require('../utils/db/write-utils');
const { query } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { buildFulfillmentFilter } = require('../utils/sql/build-order-fulfillment-filter');
const {
  ORDER_FULFILLMENT_INSERT_COLUMNS,
  ORDER_FULFILLMENT_CONFLICT_COLUMNS,
  ORDER_FULFILLMENT_UPDATE_STRATEGIES,
  buildOrderFulfillmentQuery,
  ORDER_FULFILLMENT_UPDATE_STATUS_QUERY,
} = require('./queries/order-fulfillment-queries');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates order fulfillment records.
 *
 * On conflict matching order_item_id + shipment_id:
 *  - quantity_fulfilled is incremented (add strategy)
 *  - status_id and updated fields are overwritten
 *  - fulfillment_notes are merged
 *  - fulfilled_by is coalesced (first non-null wins)
 *
 * @param {Array<Object>} fulfillments - Validated fulfillment objects to insert.
 * @param {PoolClient}    client       - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated fulfillment records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertOrderFulfillmentsBulk = async (fulfillments, client) => {
  if (!Array.isArray(fulfillments) || fulfillments.length === 0) return [];
  
  const context = 'order-fulfillment-repository/insertOrderFulfillmentsBulk';
  
  const rows = fulfillments.map((f) => [
    f.order_item_id,
    f.allocation_id         ?? null,
    f.quantity_fulfilled,
    f.status_id             ?? null,
    f.shipment_id           ?? null,
    f.fulfillment_notes     ?? null,
    null,                           // updated_at — null at insert time
    f.fulfilled_by          ?? null,
    f.created_by            ?? null,
    f.updated_by            ?? null,
  ]);
  
  validateBulkInsertRows(rows, ORDER_FULFILLMENT_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'order_fulfillments',
      ORDER_FULFILLMENT_INSERT_COLUMNS,
      rows,
      ORDER_FULFILLMENT_CONFLICT_COLUMNS,
      ORDER_FULFILLMENT_UPDATE_STRATEGIES,
      client,
      { meta: context },
      'id, order_item_id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk insert order fulfillments.',
      meta:    { fulfillmentCount: fulfillments.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'order_fulfillments',
        rows,
        rows.length,
        { context, conflictColumns: ORDER_FULFILLMENT_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches order fulfillment records matching the given filters.
 *
 * @param {Object}          filters           - Filter criteria.
 * @param {string}          [filters.orderId] - Filter by order UUID.
 * @param {string|string[]} [filters.fulfillmentIds] - Filter by fulfillment UUID(s).
 * @param {string|string[]} [filters.allocationIds]  - Filter by allocation UUID(s).
 * @param {PoolClient|null} [client=null]     - Optional DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Fulfillment rows ordered by created_at ASC.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getOrderFulfillments = async (filters, client = null) => {
  const context = 'order-fulfillment-repository/getOrderFulfillments';
  
  const { whereClause, params } = buildFulfillmentFilter(filters);
  const queryText = buildOrderFulfillmentQuery(whereClause);
  
  try {
    const { rows } = await query(queryText, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order fulfillments.',
      meta:    { filters },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters }
      ),
    });
  }
};

// ─── Update Status ────────────────────────────────────────────────────────────

/**
 * Updates the status of multiple order fulfillments by their IDs.
 *
 * Returns an empty array if no fulfillments match — not treated as an error.
 *
 * @param {Object}     options
 * @param {string}     options.statusId       - UUID of the new fulfillment status.
 * @param {string}     options.userId         - UUID of the user performing the update.
 * @param {string[]}   options.fulfillmentIds - UUIDs of fulfillments to update.
 * @param {PoolClient} client                 - DB client for transactional context.
 *
 * @returns {Promise<string[]>} UUIDs of updated fulfillment records.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const updateOrderFulfillmentStatus = async (
  { statusId, userId, fulfillmentIds },
  client
) => {
  const context = 'order-fulfillment-repository/updateOrderFulfillmentStatus';
  const params  = [statusId, userId, fulfillmentIds];
  
  try {
    const result = await query(ORDER_FULFILLMENT_UPDATE_STATUS_QUERY, params, client);
    return result.rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update order fulfillment status.',
      meta:    { statusId, fulfillmentIds },
      logFn:   (err) => logDbQueryError(
        ORDER_FULFILLMENT_UPDATE_STATUS_QUERY,
        params,
        err,
        { context, statusId, fulfillmentIds }
      ),
    });
  }
};

module.exports = {
  insertOrderFulfillmentsBulk,
  getOrderFulfillments,
  updateOrderFulfillmentStatus,
};
