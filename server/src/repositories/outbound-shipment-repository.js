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
 *  - markOutboundShipmentsShipped         — bulk transition to shipped (stamps shipped_at)
 *  - updateOutboundShipmentStatus         — bulk generic status update (no shipped_at stamp)
 *  - getPaginatedOutboundShipmentRecords  — paginated list with filtering and sorting
 *  - getShipmentDetailsById               — full detail fetch with fulfillment and batch joins
 */

'use strict';

const { bulkInsert } = require('../utils/db/write-utils');
const { query } = require('../database/db');
const {
  validateBulkInsertRows,
} = require('../utils/validation/bulk-insert-row-validator');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const {
  buildOutboundShipmentFilter,
} = require('../utils/sql/build-outbound-shipment-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  OUTBOUND_SHIPMENT_INSERT_COLUMNS,
  OUTBOUND_SHIPMENT_CONFLICT_COLUMNS,
  OUTBOUND_SHIPMENT_UPDATE_STRATEGIES,
  OUTBOUND_SHIPMENT_GET_BY_ID_QUERY,
  OUTBOUND_SHIPMENT_MARK_SHIPPED_QUERY,
  OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY,
  OUTBOUND_SHIPMENT_TABLE,
  OUTBOUND_SHIPMENT_JOINS,
  OUTBOUND_SHIPMENT_SORT_WHITELIST,
  buildOutboundShipmentPaginatedQuery,
  OUTBOUND_SHIPMENT_DETAILS_QUERY, GET_OUTBOUND_SHIPMENT_FOR_TRACKING_ATTACH,
} = require('./queries/outbound-shipment-queries');
const AppError = require('../utils/AppError');

const CONTEXT = 'outbound-shipment-repository';

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates outbound shipment records.
 *
 * On conflict matching order_id + warehouse_id, overwrites status and
 * delivery fields, merges notes, refreshes timestamps.
 *
 * Tracking numbers are attached separately via tracking-numbers-repository —
 * they live on their own table with a back-reference to outbound_shipments
 * (1:N relationship).
 *
 * @param {Array<Object>} shipments - Validated shipment objects to insert.
 * @param {PoolClient}    client    - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated shipment records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertOutboundShipmentsBulk = async (shipments, client) => {
  if (!Array.isArray(shipments) || shipments.length === 0) return [];
  
  const context = `${CONTEXT}/insertOutboundShipmentsBulk`;
  
  const rows = shipments.map((s) => [
    s.order_id,
    s.warehouse_id,
    s.delivery_method_id,
    s.status_id,
    s.shipped_at ?? null,
    s.expected_delivery_date ?? null,
    s.notes ?? null,
    s.shipment_details ?? null,
    s.created_by ?? null,
    s.updated_by ?? null,
    null, // updated_at — null at insert time
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
      meta: { shipmentCount: shipments.length },
      logFn: (err) =>
        logBulkInsertError(err, 'outbound_shipments', rows, rows.length, {
          context,
          conflictColumns: OUTBOUND_SHIPMENT_CONFLICT_COLUMNS,
        }),
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single outbound shipment record by ID.
 *
 * Returns null if no shipment exists for the given ID.
 *
 * @param {string}     shipmentId - UUID of the shipment.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Shipment row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getShipmentByShipmentId = async (shipmentId, client) => {
  const context = `${CONTEXT}/getShipmentByShipmentId`;
  
  try {
    const { rows } = await query(
      OUTBOUND_SHIPMENT_GET_BY_ID_QUERY,
      [shipmentId],
      client
    );
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch outbound shipment by ID.',
      meta: { shipmentId },
      logFn: (err) =>
        logDbQueryError(OUTBOUND_SHIPMENT_GET_BY_ID_QUERY, [shipmentId], err, {
          context,
          shipmentId,
        }),
    });
  }
};

// ─── Mark Shipped ─────────────────────────────────────────────────────────────

/**
 * Marks multiple outbound shipments as shipped — stamps shipped_at = NOW().
 *
 * Use this only for transitions into the "Shipped" lifecycle state. For all
 * other status transitions (Cancelled, OnHold, Returned, etc.) use
 * updateOutboundShipmentStatus, which does not touch shipped_at.
 *
 * Returns an empty array if no shipments match — not treated as an error.
 *
 * @param {string}     statusId    - UUID of the "Shipped" status.
 * @param {string}     userId      - UUID of the user performing the update.
 * @param {string[]}   shipmentIds - UUIDs of shipments to mark shipped.
 * @param {PoolClient} client      - DB client for transactional context.
 *
 * @returns {Promise<string[]>} UUIDs of updated shipment records.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const markOutboundShipmentsShipped = async (
  { statusId, userId, shipmentIds },
  client
) => {
  const context = `${CONTEXT}/markOutboundShipmentsShipped`;
  const params = [statusId, userId, shipmentIds];
  
  try {
    const result = await query(
      OUTBOUND_SHIPMENT_MARK_SHIPPED_QUERY,
      params,
      client
    );
    return result.rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to mark outbound shipments as shipped.',
      meta: { statusId, shipmentIds },
      logFn: (err) =>
        logDbQueryError(OUTBOUND_SHIPMENT_MARK_SHIPPED_QUERY, params, err, {
          context,
          statusId,
          shipmentIds,
        }),
    });
  }
};

// ─── Update Status ────────────────────────────────────────────────────────────

/**
 * Updates the status of multiple outbound shipments by their IDs.
 *
 * Does NOT stamp shipped_at — use markOutboundShipmentsShipped for transitions
 * into the "Shipped" state.
 *
 * Returns an empty array if no shipments match — not treated as an error.
 *
 * @param {string}     statusId    - UUID of the new status.
 * @param {string}     userId      - UUID of the user performing the update.
 * @param {string[]}   shipmentIds - UUIDs of shipments to update.
 * @param {PoolClient} client      - DB client for transactional context.
 *
 * @returns {Promise<string[]>} UUIDs of updated shipment records.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const updateOutboundShipmentStatus = async (
  { statusId, userId, shipmentIds },
  client
) => {
  const context = `${CONTEXT}/updateOutboundShipmentStatus`;
  const params = [statusId, userId, shipmentIds];
  
  try {
    const result = await query(
      OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY,
      params,
      client
    );
    return result.rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update outbound shipment status.',
      meta: { statusId, shipmentIds },
      logFn: (err) =>
        logDbQueryError(OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY, params, err, {
          context,
          statusId,
          shipmentIds,
        }),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated outbound shipment records with optional filtering and sorting.
 *
 * The list query joins a LATERAL subquery on tracking_numbers to surface the
 * primary (oldest) tracking number per shipment plus a total tracking_count —
 * shipments with multiple tracking numbers do not fan out into duplicate rows.
 *
 * @param {Object}       [filters={}]          - Field filters.
 * @param {number}       [page=1]              - Page number (1-based).
 * @param {number}       [limit=10]            - Records per page.
 * @param {string}       [sortBy='createdAt']  - Sort key (camelCase, mapped via outboundShipmentSortMap).
 * @param {'ASC'|'DESC'} [sortOrder='DESC']    - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedOutboundShipmentRecords = async ({
                                                     filters = {},
                                                     page = 1,
                                                     limit = 10,
                                                     sortBy = 'createdAt',
                                                     sortOrder = 'DESC',
                                                   }) => {
  const context = `${CONTEXT}/getPaginatedOutboundShipmentRecords`;
  
  const { whereClause, params } = buildOutboundShipmentFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'outboundShipmentSortMap',
    defaultSort: SORTABLE_FIELDS.outboundShipmentSortMap.defaultNaturalSort,
  });
  
  const queryText = buildOutboundShipmentPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName: OUTBOUND_SHIPMENT_TABLE,
      joins: OUTBOUND_SHIPMENT_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: OUTBOUND_SHIPMENT_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated outbound shipment records.',
      meta: { filters, page, limit, sortBy, sortOrder },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          page,
          limit,
        }),
    });
  }
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full shipment detail by ID including fulfillments, batches, tracking
 * numbers, and audit fields.
 *
 * Tracking numbers are aggregated into a single jsonb array per shipment via
 * a LATERAL subquery — they do not fan out into separate rows. Fulfillments
 * and shipment batches DO fan out, so the result is one row per
 * fulfillment × batch combination, all carrying the same tracking_numbers
 * array. Group by shipment_id in the transformer.
 *
 * Returns an empty array if no shipment exists for the given ID.
 *
 * @param {string} shipmentId - UUID of the shipment.
 *
 * @returns {Promise<Array<Object>>} Shipment detail rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getShipmentDetailsById = async (shipmentId) => {
  const context = `${CONTEXT}/getShipmentDetailsById`;
  
  try {
    const { rows } = await query(OUTBOUND_SHIPMENT_DETAILS_QUERY, [shipmentId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch shipment details.',
      meta: { shipmentId },
      logFn: (err) =>
        logDbQueryError(OUTBOUND_SHIPMENT_DETAILS_QUERY, [shipmentId], err, {
          context,
          shipmentId,
        }),
    });
  }
};

/**
 * Fetches outbound shipment context required before attaching tracking
 * information.
 *
 * Includes shipment identity, order/warehouse references, current status, and
 * delivery-method rules used by the tracking-number service for validation.
 *
 * Returns null if no shipment exists for the given ID.
 *
 * @param {string} shipmentId - UUID of the outbound shipment.
 * @param {object} [client] - Optional database client/transaction client.
 *
 * @returns {Promise<OutboundShipmentTrackingAttachRow|null>}
 *
 * @throws {AppError} Normalized database error if the query fails.
 */
const getOutboundShipmentForTrackingAttach = async (shipmentId, client) => {
  const context = `${CONTEXT}/getOutboundShipmentForTrackingAttach`;

  try {
    const { rows } = await query(
      GET_OUTBOUND_SHIPMENT_FOR_TRACKING_ATTACH,
      [shipmentId],
      client
    );
    
    if (rows.length === 0) return null;
    
    return rows[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    return handleDbError(error, {
      context,
      logFn: (err) =>
        logDbQueryError(GET_OUTBOUND_SHIPMENT_FOR_TRACKING_ATTACH,[shipmentId], err, {
          context,
          shipmentId,
        }),
    });
  }
};

module.exports = {
  insertOutboundShipmentsBulk,
  getShipmentByShipmentId,
  markOutboundShipmentsShipped,
  updateOutboundShipmentStatus,
  getPaginatedOutboundShipmentRecords,
  getShipmentDetailsById,
  getOutboundShipmentForTrackingAttach,
};
