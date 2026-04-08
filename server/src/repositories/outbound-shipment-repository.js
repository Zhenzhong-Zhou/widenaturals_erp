/**
 * @file outbound-shipment-repository.js
 * @description Database access layer for outbound shipment records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from outbound-shipment-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertOutboundShipmentsBulk          — bulk upsert with conflict resolution
 *  - getShipmentByShipmentId              — fetch single shipment by id
 *  - updateOutboundShipmentStatus         — bulk status update by id array
 *  - getPaginatedOutboundShipmentRecords  — paginated list with filtering and sorting
 *  - getShipmentDetailsById               — full detail fetch with fulfillment and batch joins
 */

'use strict';

const { bulkInsert } = require('../utils/db/write-utils');
const { query } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { buildOutboundShipmentFilter } = require('../utils/sql/build-outbound-shipment-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  OUTBOUND_SHIPMENT_INSERT_COLUMNS,
  OUTBOUND_SHIPMENT_CONFLICT_COLUMNS,
  OUTBOUND_SHIPMENT_UPDATE_STRATEGIES,
  OUTBOUND_SHIPMENT_GET_BY_ID_QUERY,
  OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY,
  OUTBOUND_SHIPMENT_TABLE,
  OUTBOUND_SHIPMENT_JOINS,
  OUTBOUND_SHIPMENT_SORT_WHITELIST,
  buildOutboundShipmentPaginatedQuery,
  OUTBOUND_SHIPMENT_DETAILS_QUERY,
} = require('./queries/outbound-shipment-queries');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates outbound shipment records.
 *
 * On conflict matching order_id + warehouse_id, overwrites status and
 * delivery fields, merges notes, refreshes timestamps.
 *
 * @param {Array<Object>}              shipments - Validated shipment objects to insert.
 * @param {PoolClient}    client    - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated shipment records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertOutboundShipmentsBulk = async (shipments, client) => {
  if (!Array.isArray(shipments) || shipments.length === 0) return [];
  
  const context = 'outbound-shipment-repository/insertOutboundShipmentsBulk';
  
  const rows = shipments.map((s) => [
    s.order_id,
    s.warehouse_id,
    s.delivery_method_id        ?? null,
    s.tracking_number_id        ?? null,
    s.status_id,
    s.shipped_at                ?? null,
    s.expected_delivery_date    ?? null,
    s.notes                     ?? null,
    s.shipment_details          ?? null,
    s.created_by                ?? null,
    s.updated_by                ?? null,
    null,                               // updated_at — null at insert time
  ]);
  
  validateBulkInsertRows(rows, OUTBOUND_SHIPMENT_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'outbound_shipments',
      OUTBOUND_SHIPMENT_INSERT_COLUMNS,
      rows,
      OUTBOUND_SHIPMENT_CONFLICT_COLUMNS,
      OUTBOUND_SHIPMENT_UPDATE_STRATEGIES,
      client,
      { meta: { context } },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert outbound shipments.',
      meta:    { shipmentCount: shipments.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'outbound_shipments',
        rows,
        rows.length,
        { context, conflictColumns: OUTBOUND_SHIPMENT_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single outbound shipment record by ID.
 *
 * Returns null if no shipment exists for the given ID.
 *
 * @param {string}                  shipmentId - UUID of the shipment.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Shipment row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getShipmentByShipmentId = async (shipmentId, client) => {
  const context = 'outbound-shipment-repository/getShipmentByShipmentId';
  
  try {
    const { rows } = await query(OUTBOUND_SHIPMENT_GET_BY_ID_QUERY, [shipmentId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch outbound shipment by ID.',
      meta:    { shipmentId },
      logFn:   (err) => logDbQueryError(
        OUTBOUND_SHIPMENT_GET_BY_ID_QUERY, [shipmentId], err, { context, shipmentId }
      ),
    });
  }
};

// ─── Update Status ────────────────────────────────────────────────────────────

/**
 * Updates the status of multiple outbound shipments by their IDs.
 *
 * Returns an empty array if no shipments match — not treated as an error.
 *
 * @param {Object}                  options
 * @param {string}                  options.statusId    - UUID of the new status.
 * @param {string}                  options.userId      - UUID of the user performing the update.
 * @param {string[]}                options.shipmentIds - UUIDs of shipments to update.
 * @param {PoolClient} client              - DB client for transactional context.
 *
 * @returns {Promise<string[]>} UUIDs of updated shipment records.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const updateOutboundShipmentStatus = async (
  { statusId, userId, shipmentIds },
  client
) => {
  const context = 'outbound-shipment-repository/updateOutboundShipmentStatus';
  const params  = [statusId, userId, shipmentIds];
  
  try {
    const result = await query(OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY, params, client);
    return result.rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update outbound shipment status.',
      meta:    { statusId, shipmentIds },
      logFn:   (err) => logDbQueryError(
        OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY, params, err, { context, statusId, shipmentIds }
      ),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated outbound shipment records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]             - Field filters.
 * @param {number}       [options.page=1]                 - Page number (1-based).
 * @param {number}       [options.limit=10]               - Records per page.
 * @param {string}       [options.sortBy='os.created_at'] - Sort key (mapped via outboundShipmentSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']       - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedOutboundShipmentRecords = async ({
                                                     filters   = {},
                                                     page      = 1,
                                                     limit     = 10,
                                                     sortBy    = 'os.created_at',
                                                     sortOrder = 'DESC',
                                                   }) => {
  const context = 'outbound-shipment-repository/getPaginatedOutboundShipmentRecords';
  
  const { whereClause, params } = buildOutboundShipmentFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'outboundShipmentSortMap',
    defaultSort: SORTABLE_FIELDS.outboundShipmentSortMap.defaultNaturalSort,
  });
  
  const queryText = buildOutboundShipmentPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    OUTBOUND_SHIPMENT_TABLE,
      joins:        OUTBOUND_SHIPMENT_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: OUTBOUND_SHIPMENT_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated outbound shipment records.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, page, limit }
      ),
    });
  }
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full shipment detail by ID including fulfillments, batches, and audit fields.
 *
 * Returns multiple rows per shipment — one per fulfillment/batch combination.
 * Returns an empty array if no shipment exists for the given ID.
 *
 * @param {string} shipmentId - UUID of the shipment.
 *
 * @returns {Promise<Array<Object>>} Shipment detail rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getShipmentDetailsById = async (shipmentId) => {
  const context = 'outbound-shipment-repository/getShipmentDetailsById';
  
  try {
    const { rows } = await query(OUTBOUND_SHIPMENT_DETAILS_QUERY, [shipmentId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch shipment details.',
      meta:    { shipmentId },
      logFn:   (err) => logDbQueryError(
        OUTBOUND_SHIPMENT_DETAILS_QUERY, [shipmentId], err, { context, shipmentId }
      ),
    });
  }
};

module.exports = {
  insertOutboundShipmentsBulk,
  getShipmentByShipmentId,
  updateOutboundShipmentStatus,
  getPaginatedOutboundShipmentRecords,
  getShipmentDetailsById,
};
