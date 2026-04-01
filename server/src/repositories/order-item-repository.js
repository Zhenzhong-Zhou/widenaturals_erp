/**
 * @file order-item-repository.js
 * @description Database access layer for order item records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from order-item-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertOrderItemsBulk                  — bulk upsert split by item type
 *  - findOrderItemsByOrderId               — full detail fetch by order_id
 *  - updateOrderItemStatusesByOrderId      — bulk status update by order_id
 *  - updateOrderItemStatus                 — single item status update
 *  - getOrderItemsByOrderId                — lightweight fetch by order_id
 *  - validateFullAllocationForFulfillment  — checks for under-allocated items
 *  - skuHasActiveOrders                   — EXISTS check for SKU active orders
 */

'use strict';

const { bulkInsert, query } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { existsQuery } = require('./utils/repository-helper');
const {
  ORDER_ITEM_INSERT_COLUMNS,
  ORDER_ITEM_UPDATE_STRATEGIES,
  ORDER_ITEM_EXTRA_UPDATES,
  ORDER_ITEM_SKU_CONFLICT_COLUMNS,
  ORDER_ITEM_PACKAGING_CONFLICT_COLUMNS,
  ORDER_ITEM_FIND_BY_ORDER_QUERY,
  ORDER_ITEM_GET_BY_ORDER_QUERY,
  ORDER_ITEM_UPDATE_STATUS_BY_ORDER,
  ORDER_ITEM_UPDATE_STATUS_BY_ID,
  ORDER_ITEM_VALIDATE_ALLOCATION_QUERY,
  ORDER_ITEM_SKU_ACTIVE_ORDERS_QUERY,
} = require('./queries/order-item-queries');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates order items split by item type.
 *
 * Each item must have exactly one of sku_id or packaging_material_id.
 * Items are split into two batches and inserted separately because each
 * type has a different unique constraint conflict target.
 *
 * On conflict:
 *  - quantity_ordered is incremented
 *  - subtotal is recalculated from the cumulative quantity
 *  - price and metadata are overwritten
 *
 * @param {string}     orderId    - UUID of the order.
 * @param {Array}      orderItems - Validated order item objects.
 * @param {PoolClient} client     - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated order item records.
 * @throws  {AppError}               Validation error if any item has invalid type combination.
 * @throws  {AppError}               Normalized database error if any insert fails.
 */
const insertOrderItemsBulk = async (orderId, orderItems, client) => {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return [];
  
  const context = 'order-item-repository/insertOrderItemsBulk';
  
  // ─── Validate Item Types ────────────────────────────────────────────────────
  // Validation is before any IO — must not be inside the try block.
  
  const invalidItems = orderItems.filter(
    (item) =>
      (item.sku_id && item.packaging_material_id) ||
      (!item.sku_id && !item.packaging_material_id)
  );
  
  if (invalidItems.length > 0) {
    throw AppError.validationError(
      'Each order item must have exactly one of sku_id or packaging_material_id.',
      { context, meta: { invalidCount: invalidItems.length } }
    );
  }
  
  const mapToRow = (item) => [
    orderId,
    item.sku_id                 ?? null,
    item.packaging_material_id  ?? null,
    item.quantity_ordered,
    item.price_id               ?? null,
    item.price                  ?? null,
    item.subtotal               ?? (item.price ?? 0) * item.quantity_ordered,
    item.status_id,
    item.metadata               ?? null,
    null,                               // updated_at — null at insert time
    item.created_by             ?? null,
    item.updated_by             ?? null,
  ];
  
  const skuItems      = orderItems.filter((item) => item.sku_id && !item.packaging_material_id);
  const packagingItems = orderItems.filter((item) => !item.sku_id && item.packaging_material_id);
  
  // ─── Validate Row Lengths ───────────────────────────────────────────────────
  
  if (skuItems.length)       validateBulkInsertRows(skuItems.map(mapToRow),       ORDER_ITEM_INSERT_COLUMNS.length);
  if (packagingItems.length) validateBulkInsertRows(packagingItems.map(mapToRow), ORDER_ITEM_INSERT_COLUMNS.length);
  
  // ─── Insert ─────────────────────────────────────────────────────────────────
  
  try {
    const results = [];
    
    if (skuItems.length) {
      const rows   = skuItems.map(mapToRow);
      const result = await bulkInsert(
        'order_items',
        ORDER_ITEM_INSERT_COLUMNS,
        rows,
        ORDER_ITEM_SKU_CONFLICT_COLUMNS,
        ORDER_ITEM_UPDATE_STRATEGIES,
        client,
        { context: `${context}:sku`, extraUpdates: ORDER_ITEM_EXTRA_UPDATES }
      );
      results.push(...result);
    }
    
    if (packagingItems.length) {
      const rows   = packagingItems.map(mapToRow);
      const result = await bulkInsert(
        'order_items',
        ORDER_ITEM_INSERT_COLUMNS,
        rows,
        ORDER_ITEM_PACKAGING_CONFLICT_COLUMNS,
        ORDER_ITEM_UPDATE_STRATEGIES,
        client,
        { context: `${context}:packaging`, extraUpdates: ORDER_ITEM_EXTRA_UPDATES }
      );
      results.push(...result);
    }
    
    return results;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk insert order items.',
      meta:    { orderItemCount: orderItems.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'order_items',
        [],
        orderItems.length,
        { context }
      ),
    });
  }
};

// ─── Find By Order (full detail) ─────────────────────────────────────────────

/**
 * Fetches full order item detail for a given order.
 *
 * Includes pricing, status, product, packaging, and audit fields.
 * Returns an empty array if no items exist for the order.
 *
 * @param {string} orderId - UUID of the order.
 *
 * @returns {Promise<Array<Object>>} Order item rows ordered by created_at.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const findOrderItemsByOrderId = async (orderId) => {
  const context = 'order-item-repository/findOrderItemsByOrderId';
  
  try {
    const { rows } = await query(ORDER_ITEM_FIND_BY_ORDER_QUERY, [orderId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order items.',
      meta:    { orderId },
      logFn:   (err) => logDbQueryError(
        ORDER_ITEM_FIND_BY_ORDER_QUERY,
        [orderId],
        err,
        { context, orderId }
      ),
    });
  }
};

// ─── Update Status By Order ───────────────────────────────────────────────────

/**
 * Bulk updates status for all order items belonging to an order.
 *
 * Skips items where the status already matches — IS DISTINCT FROM ensures
 * only genuinely changed rows are updated and returned.
 * Returns an empty array if all statuses already match.
 *
 * @param {PoolClient} client
 * @param {Object}     options
 * @param {string}     options.orderId      - UUID of the order.
 * @param {string}     options.newStatusId  - UUID of the new status.
 * @param {string}     options.updatedBy    - UUID of the user performing the update.
 *
 * @returns {Promise<Array<{ id: string, status_id: string, status_date: Date }>>}
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateOrderItemStatusesByOrderId = async (
  client,
  { orderId, newStatusId, updatedBy }
) => {
  const context = 'order-item-repository/updateOrderItemStatusesByOrderId';
  const values  = [newStatusId, updatedBy, orderId];
  
  try {
    const result = await query(ORDER_ITEM_UPDATE_STATUS_BY_ORDER, values, client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update order item statuses by order.',
      meta:    { orderId, newStatusId },
      logFn:   (err) => logDbQueryError(
        ORDER_ITEM_UPDATE_STATUS_BY_ORDER,
        values,
        err,
        { context, orderId, newStatusId }
      ),
    });
  }
};

// ─── Update Status By Item ────────────────────────────────────────────────────

/**
 * Updates the status of a single order item.
 *
 * Returns null if the status already matches — IS DISTINCT FROM ensures
 * no-op updates return null rather than the unchanged row.
 *
 * @param {PoolClient} client
 * @param {Object}     options
 * @param {string}     options.orderItemId  - UUID of the order item.
 * @param {string}     options.newStatusId  - UUID of the new status.
 * @param {string}     options.updatedBy    - UUID of the user performing the update.
 *
 * @returns {Promise<{ id: string, status_id: string, status_date: Date }|null>}
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateOrderItemStatus = async (
  client,
  { orderItemId, newStatusId, updatedBy }
) => {
  const context = 'order-item-repository/updateOrderItemStatus';
  const values  = [newStatusId, updatedBy, orderItemId];
  
  try {
    const result = await query(ORDER_ITEM_UPDATE_STATUS_BY_ID, values, client);
    return result.rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update order item status.',
      meta:    { orderItemId, newStatusId },
      logFn:   (err) => logDbQueryError(
        ORDER_ITEM_UPDATE_STATUS_BY_ID,
        values,
        err,
        { context, orderItemId, newStatusId }
      ),
    });
  }
};

// ─── Get By Order (lightweight) ──────────────────────────────────────────────

/**
 * Fetches lightweight order item records for a given order.
 *
 * Minimal projection for fulfillment and allocation flows.
 *
 * @param {string}     orderId - UUID of the order.
 * @param {PoolClient} client  - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Lightweight order item rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getOrderItemsByOrderId = async (orderId, client) => {
  const context = 'order-item-repository/getOrderItemsByOrderId';
  
  try {
    const result = await query(ORDER_ITEM_GET_BY_ORDER_QUERY, [orderId], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order items by order ID.',
      meta:    { orderId },
      logFn:   (err) => logDbQueryError(
        ORDER_ITEM_GET_BY_ORDER_QUERY,
        [orderId],
        err,
        { context, orderId }
      ),
    });
  }
};

// ─── Allocation Validation ────────────────────────────────────────────────────

/**
 * Checks whether all order items are fully allocated.
 *
 * Returns the first under-allocated row if any exist, or null if all items
 * are fully allocated. Caller interprets null as fully allocated.
 *
 * @param {string}          orderId       - UUID of the order to validate.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<Object|null>} First under-allocated row, or null if fully allocated.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const validateFullAllocationForFulfillment = async (orderId, client = null) => {
  const context = 'order-item-repository/validateFullAllocationForFulfillment';
  
  try {
    const { rows } = await query(ORDER_ITEM_VALIDATE_ALLOCATION_QUERY, [orderId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to validate order item allocations for fulfillment.',
      meta:    { orderId },
      logFn:   (err) => logDbQueryError(
        ORDER_ITEM_VALIDATE_ALLOCATION_QUERY,
        [orderId],
        err,
        { context, orderId }
      ),
    });
  }
};

// ─── Existence Check ──────────────────────────────────────────────────────────

/**
 * Checks whether a SKU has any order items in an active order status.
 *
 * @param {string}          skuId                - UUID of the SKU to check.
 * @param {string[]}        activeOrderStatusIds  - UUIDs of active order statuses.
 * @param {PoolClient|null} [client=null]         - Optional DB client.
 *
 * @returns {Promise<boolean>} True if at least one active order exists for the SKU.
 * @throws  {AppError}         Normalized database error if the query fails.
 */
const skuHasActiveOrders = async (skuId, activeOrderStatusIds, client = null) => {
  const context = 'order-item-repository/skuHasActiveOrders';
  
  return existsQuery(
    ORDER_ITEM_SKU_ACTIVE_ORDERS_QUERY,
    [skuId, activeOrderStatusIds],
    context,
    'Failed to check SKU active order dependency',
    client
  );
};

module.exports = {
  insertOrderItemsBulk,
  findOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId,
  updateOrderItemStatus,
  getOrderItemsByOrderId,
  validateFullAllocationForFulfillment,
  skuHasActiveOrders,
};
