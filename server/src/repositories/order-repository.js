/**
 * @file order-repository.js
 * @description Database access layer for order records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from order-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertOrder                        — insert single order record
 *  - getPaginatedOrders                 — paginated list with filtering and sorting
 *  - findOrderByIdWithDetails           — full detail fetch by order id
 *  - updateOrderData                    — dynamic partial update with metadata merge
 *  - fetchOrderMetadata                 — lightweight status/type metadata fetch
 *  - updateOrderStatus                  — update order status by id
 *  - getInventoryAllocationsByOrderId   — fetch allocations by order id
 *  - getSalesOrderShipmentMetadata      — fetch shipment metadata by order id
 */

'use strict';

const { query } = require('../database/db');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildOrderFilter } = require('../utils/sql/build-order-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  ORDER_INSERT_QUERY,
  ORDER_PAGINATED_TABLE,
  ORDER_PAGINATED_JOINS,
  ORDER_PAGINATED_SORT_WHITELIST,
  buildOrderPaginatedQuery,
  ORDER_FIND_BY_ID_QUERY,
  ORDER_FETCH_METADATA_QUERY,
  ORDER_UPDATE_STATUS_QUERY,
  ORDER_GET_ALLOCATIONS_QUERY,
  ORDER_GET_SHIPMENT_METADATA_QUERY,
} = require('./queries/order-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a new order record and returns the generated ID.
 *
 * @param {Object}     orderData                        - Order fields to insert.
 * @param {string}     orderData.id                     - UUID for the new order.
 * @param {string}     orderData.order_number           - Unique order number.
 * @param {string}     orderData.order_type_id          - UUID of the order type.
 * @param {string}     orderData.order_date             - ISO date string.
 * @param {string}     orderData.order_status_id        - UUID of the initial status.
 * @param {string|null} [orderData.note=null]           - Optional order note.
 * @param {string|null} [orderData.shipping_address_id=null]
 * @param {string|null} [orderData.billing_address_id=null]
 * @param {string}     orderData.created_by             - UUID of the creating user.
 * @param {string|null} [orderData.updated_at=null]
 * @param {string|null} [orderData.updated_by=null]
 * @param {PoolClient} client                           - DB client for transactional context.
 *
 * @returns {Promise<string>} UUID of the inserted order.
 * @throws  {AppError}        Normalized database error if the insert fails.
 */
const insertOrder = async (orderData, client) => {
  const context = 'order-repository/insertOrder';

  const {
    id,
    order_number,
    order_type_id,
    order_date,
    order_status_id,
    note = null,
    shipping_address_id = null,
    billing_address_id = null,
    created_by,
    updated_at = null,
    updated_by = null,
  } = orderData;

  const values = [
    id,
    order_number,
    order_type_id,
    order_date,
    order_status_id,
    note,
    shipping_address_id,
    billing_address_id,
    created_by,
    updated_at,
    updated_by,
  ];

  try {
    const { rows } = await query(ORDER_INSERT_QUERY, values, client);
    return rows[0]?.id;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert order.',
      meta: { order_number },
      logFn: (err) =>
        logDbQueryError(ORDER_INSERT_QUERY, values, err, {
          context,
          order_number,
        }),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated order records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]            - Field filters.
 * @param {number}       [options.page=1]                - Page number (1-based).
 * @param {number}       [options.limit=10]              - Records per page.
 * @param {string}       [options.sortBy='o.created_at'] - Whitelisted DB column.
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']      - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedOrders = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'o.created_at',
  sortOrder = 'DESC',
}) => {
  const context = 'order-repository/getPaginatedOrders';

  const { whereClause, params } = buildOrderFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'orderSortMap',
    defaultSort: SORTABLE_FIELDS.orderSortMap.defaultNaturalSort,
  });

  const queryText = buildOrderPaginatedQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: ORDER_PAGINATED_TABLE,
      joins: ORDER_PAGINATED_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: ORDER_PAGINATED_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated orders.',
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

// ─── Find By ID (full detail) ─────────────────────────────────────────────────

/**
 * Fetches full order detail by ID including sales order, address, and audit fields.
 *
 * Returns null if no order exists for the given ID.
 *
 * @param {string} orderId - UUID of the order.
 *
 * @returns {Promise<Object|null>} Full order detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const findOrderByIdWithDetails = async (orderId) => {
  const context = 'order-repository/findOrderByIdWithDetails';

  try {
    const { rows } = await query(ORDER_FIND_BY_ID_QUERY, [orderId]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order details.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(ORDER_FIND_BY_ID_QUERY, [orderId], err, {
          context,
          orderId,
        }),
    });
  }
};

// ─── Dynamic Update ───────────────────────────────────────────────────────────

/**
 * Performs a partial update on an order record with optional metadata merge.
 *
 * Dynamically builds the SET clause from updateData fields. Metadata is
 * merged with the existing value rather than overwritten.
 *
 * Not-found check is outside the try block — AppError.notFoundError must
 * not be caught and re-thrown as a databaseError.
 *
 * @param {string}     orderId    - UUID of the order to update.
 * @param {Object}     updateData - Fields to update.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<{ id: string }>} The updated order ID.
 * @throws  {AppError}                Not found error if the order does not exist.
 * @throws  {AppError}                Normalized database error if the update fails.
 */
const updateOrderData = async (orderId, updateData, client) => {
  const context = 'order-repository/updateOrderData';

  // ─── Fetch Existing Metadata ────────────────────────────────────────────────

  let rows;

  try {
    ({ rows } = await query(
      `SELECT metadata FROM orders WHERE id = $1`,
      [orderId],
      client
    ));
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order metadata for update.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(
          'SELECT metadata FROM orders WHERE id = $1',
          [orderId],
          err,
          { context, orderId }
        ),
    });
  }

  // Not-found check is outside the try block — AppError.notFoundError must
  // not be caught and re-thrown as a databaseError.
  if (!rows.length) {
    throw AppError.notFoundError(`Order ${orderId} not found.`, { context });
  }

  const existingMetadata = rows[0].metadata ?? {};

  // ─── Merge Metadata ─────────────────────────────────────────────────────────

  if (updateData.manual_price_overrides) {
    existingMetadata.manual_price_overrides = [
      ...(existingMetadata.manual_price_overrides ?? []),
      ...updateData.manual_price_overrides,
    ];
  }

  // ─── Build Dynamic SET Clause ────────────────────────────────────────────────

  const updateFields = [];
  const updateValues = [];
  let index = 1;

  if (updateData.discount_id) {
    updateFields.push(`discount_id = $${index}`);
    updateValues.push(updateData.discount_id);
    index++;
  }

  if (updateData.tax_amount !== undefined) {
    updateFields.push(`tax_amount = $${index}`);
    updateValues.push(updateData.tax_amount);
    index++;
  }

  if (updateData.total_amount !== undefined) {
    updateFields.push(`total_amount = $${index}`);
    updateValues.push(updateData.total_amount);
    index++;
  }

  if (updateData.status_id) {
    updateFields.push(`order_status_id = $${index}`);
    updateValues.push(updateData.status_id);
    index++;
    // Status change always refreshes status_date — no param needed.
    updateFields.push(`status_date = NOW()`);
  }

  if (updateData.note) {
    updateFields.push(`note = $${index}`);
    updateValues.push(updateData.note);
    index++;
  }

  // Metadata and timestamps are always updated.
  updateFields.push(`metadata = $${index}`);
  updateValues.push(existingMetadata);
  index++;
  updateFields.push(`updated_at = NOW()`);

  if (updateData.updated_by) {
    updateFields.push(`updated_by = $${index}`);
    updateValues.push(updateData.updated_by);
    index++;
  }

  updateValues.push(orderId);

  const updateQuery = `
    UPDATE orders
    SET ${updateFields.join(', ')}
    WHERE id = $${index}
    RETURNING id
  `;

  // ─── Execute Update ──────────────────────────────────────────────────────────

  try {
    const { rows: updatedRows } = await query(
      updateQuery,
      updateValues,
      client
    );
    return updatedRows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update order.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(updateQuery, updateValues, err, { context, orderId }),
    });
  }
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

/**
 * Fetches lightweight order metadata for status and type resolution.
 *
 * Used in service flows that need to validate order state before performing
 * operations — does not return the full order shape.
 *
 * Not-found check is outside the try block.
 *
 * @param {string}     orderId - UUID of the order.
 * @param {PoolClient} client  - DB client for transactional context.
 *
 * @returns {Promise<Object>} Order metadata row.
 * @throws  {AppError}         Not found error if the order does not exist.
 * @throws  {AppError}         Normalized database error if the query fails.
 */
const fetchOrderMetadata = async (orderId, client) => {
  const context = 'order-repository/fetchOrderMetadata';

  let rows;

  try {
    ({ rows } = await query(ORDER_FETCH_METADATA_QUERY, [orderId], client));
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order metadata.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(ORDER_FETCH_METADATA_QUERY, [orderId], err, {
          context,
          orderId,
        }),
    });
  }

  if (!rows.length) {
    throw AppError.notFoundError(`Order ${orderId} not found.`, { context });
  }

  return rows[0];
};

// ─── Update Status ────────────────────────────────────────────────────────────

/**
 * Updates the status of an order by ID.
 *
 * Returns null if the status already matches — IS DISTINCT FROM ensures
 * no-op updates return null rather than the unchanged row.
 *
 * @param {PoolClient} client
 * @param {Object}     options
 * @param {string}     options.orderId      - UUID of the order.
 * @param {string}     options.newStatusId  - UUID of the new status.
 * @param {string}     options.updatedBy    - UUID of the user performing the update.
 *
 * @returns {Promise<{ id: string, order_status_id: string, status_date: Date }|null>}
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateOrderStatus = async (
  client,
  { orderId, newStatusId, updatedBy }
) => {
  const context = 'order-repository/updateOrderStatus';
  const values = [newStatusId, updatedBy, orderId];

  try {
    const result = await query(ORDER_UPDATE_STATUS_QUERY, values, client);
    return result.rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update order status.',
      meta: { orderId, newStatusId },
      logFn: (err) =>
        logDbQueryError(ORDER_UPDATE_STATUS_QUERY, values, err, {
          context,
          orderId,
          newStatusId,
        }),
    });
  }
};

// ─── Allocations By Order ─────────────────────────────────────────────────────

/**
 * Fetches inventory allocations for all items in an order.
 *
 * @param {string}     orderId - UUID of the order.
 * @param {PoolClient} client  - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Allocation rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getInventoryAllocationsByOrderId = async (orderId, client) => {
  const context = 'order-repository/getInventoryAllocationsByOrderId';

  try {
    const result = await query(ORDER_GET_ALLOCATIONS_QUERY, [orderId], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order allocation details.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(ORDER_GET_ALLOCATIONS_QUERY, [orderId], err, {
          context,
          orderId,
        }),
    });
  }
};

// ─── Shipment Metadata ────────────────────────────────────────────────────────

/**
 * Fetches shipment metadata for a sales order including all order item IDs.
 *
 * Returns null if no sales order exists for the given order ID.
 *
 * @param {string}          orderId       - UUID of the order.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Shipment metadata row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getSalesOrderShipmentMetadata = async (orderId, client = null) => {
  const context = 'order-repository/getSalesOrderShipmentMetadata';

  try {
    const { rows } = await query(
      ORDER_GET_SHIPMENT_METADATA_QUERY,
      [orderId],
      client
    );
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch sales order shipment metadata.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(ORDER_GET_SHIPMENT_METADATA_QUERY, [orderId], err, {
          context,
          orderId,
        }),
    });
  }
};

module.exports = {
  insertOrder,
  getPaginatedOrders,
  findOrderByIdWithDetails,
  updateOrderData,
  fetchOrderMetadata,
  updateOrderStatus,
  getInventoryAllocationsByOrderId,
  getSalesOrderShipmentMetadata,
};
