/**
 * @file inventory-allocation-repository.js
 * @description Database access layer for inventory allocation records.
 *
 * Follows the canonical repository pattern:
 *  - All SQL lives in inventory-allocation-queries.js — never inlined here
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *  - Not-found checks live outside try blocks
 *
 * Exception: getMismatchedAllocationIds emits logSystemWarn on detected
 * mismatches — this is a security-notable business event, not a success log.
 *
 * Exports:
 *  - insertInventoryAllocationsBulk    — bulk upsert with conflict resolution
 *  - updateInventoryAllocationStatus   — bulk status update by allocation ID array
 *  - getMismatchedAllocationIds        — CTE-based validation of allocation ownership
 *  - getInventoryAllocationReview      — full CTE review fetch scoped by order and warehouse
 *  - getPaginatedInventoryAllocations  — CTE-based paginated list with ACL-scoped filtering
 *                                        and dedicated count query for correct aggregated row count
 *  - getAllocationsByOrderId           — fetch allocations by order with optional ID filter
 *  - getAllocationStatuses             — fetch allocation status codes by order and item IDs
 *  - skuHasActiveAllocations          — EXISTS check for active SKU allocations
 */

'use strict';

const { bulkInsert } = require('../utils/db/write-utils');
const { query } = require('../database/db');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const {
  validateBulkInsertRows,
} = require('../utils/validation/bulk-insert-row-validator');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { logSystemWarn } = require('../utils/logging/system-logger');
const {
  buildInventoryAllocationFilter,
} = require('../utils/sql/build-inventory-allocation-filter');
const { existsQuery } = require('./utils/repository-helper');
const {
  INVENTORY_ALLOCATION_INSERT_COLUMNS,
  INVENTORY_ALLOCATION_CONFLICT_COLUMNS,
  INVENTORY_ALLOCATION_UPDATE_STRATEGIES,
  INVENTORY_ALLOCATION_EXTRA_UPDATES,
  INVENTORY_ALLOCATION_UPDATE_STATUS_QUERY,
  INVENTORY_ALLOCATION_MISMATCHED_IDS_QUERY,
  INVENTORY_ALLOCATION_REVIEW_QUERY,
  INVENTORY_ALLOCATION_PAGINATED_SORT_WHITELIST,
  INVENTORY_ALLOCATION_BASE_QUERY,
  INVENTORY_ALLOCATION_BY_ORDER_BASE,
  INVENTORY_ALLOCATION_STATUSES_BASE,
  SKU_ACTIVE_ALLOCATIONS_QUERY,
  INVENTORY_ALLOCATION_COUNT_QUERY,
} = require('./queries/inventory-allocation-queries');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');

const CONTEXT = 'inventory-allocation-repository';

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts inventory allocation records with conflict resolution.
 *
 * On conflict matching target_item_id + batch_id + warehouse_id, overwrites
 * allocated_quantity, status_id, updated_by, and refreshes timestamps via NOW().
 *
 * @param {Array<Object>} allocations - Validated allocation objects to insert.
 * @param {PoolClient}    client      - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or upserted allocation records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertInventoryAllocationsBulk = async (allocations, client) => {
  const context = `${CONTEXT}/insertInventoryAllocationsBulk`;

  const rows = allocations.map((item) => [
    item.order_item_id ?? null,
    item.transfer_order_item_id ?? null,
    item.warehouse_id,
    item.batch_id,
    item.allocated_quantity,
    item.status_id,
    item.allocated_at ?? null,
    item.created_by ?? null,
    item.updated_by ?? null,
    item.updated_at ?? null,
  ]);

  validateBulkInsertRows(rows, INVENTORY_ALLOCATION_INSERT_COLUMNS.length);

  try {
    return await bulkInsert(
      'inventory_allocations',
      INVENTORY_ALLOCATION_INSERT_COLUMNS,
      rows,
      INVENTORY_ALLOCATION_CONFLICT_COLUMNS,
      INVENTORY_ALLOCATION_UPDATE_STRATEGIES,
      client,
      {
        context,
        extraUpdates: INVENTORY_ALLOCATION_EXTRA_UPDATES,
      }
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk insert inventory allocations.',
      meta: { rowCount: allocations.length },
      logFn: (err) =>
        logBulkInsertError(err, 'inventory_allocations', rows, rows.length, {
          context,
          conflictColumns: INVENTORY_ALLOCATION_CONFLICT_COLUMNS,
        }),
    });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Updates the status of multiple inventory allocations by their IDs.
 *
 * Returns an empty array if no allocations match — not treated as an error.
 *
 * @param {Object}     options
 * @param {string}     options.statusId       - UUID of the new allocation status.
 * @param {string}     options.userId         - UUID of the user performing the update.
 * @param {string[]}   options.allocationIds  - UUIDs of allocations to update.
 * @param {PoolClient} client                 - DB client for transactional context.
 *
 * @returns {Promise<string[]>} UUIDs of updated allocation records.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const updateInventoryAllocationStatus = async (
  { statusId, userId, allocationIds },
  client
) => {
  const context = `${CONTEXT}/updateInventoryAllocationStatus`;
  const params = [statusId, userId, allocationIds];

  try {
    const result = await query(
      INVENTORY_ALLOCATION_UPDATE_STATUS_QUERY,
      params,
      client
    );
    return result.rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update inventory allocation status.',
      meta: { statusId, allocationIds },
      logFn: (err) =>
        logDbQueryError(INVENTORY_ALLOCATION_UPDATE_STATUS_QUERY, params, err, {
          context,
          statusId,
          allocationIds,
        }),
    });
  }
};

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns allocation IDs from the input that do not belong to the given order.
 *
 * Used to validate allocation ownership before bulk status updates.
 * Logs a warning when mismatches are detected — this is a notable business
 * event that warrants attention even when handled gracefully.
 *
 * @param {string}     orderId       - UUID of the order to validate against.
 * @param {string[]}   allocationIds - UUIDs to validate.
 * @param {PoolClient} client        - DB client for transactional context.
 *
 * @returns {Promise<string[]>} Mismatched allocation UUIDs.
 * @throws  {AppError}          Normalized database error if the query fails.
 */
const getMismatchedAllocationIds = async (orderId, allocationIds, client) => {
  if (!allocationIds?.length) return [];

  const context = `${CONTEXT}/getMismatchedAllocationIds`;
  const params = [orderId, allocationIds];

  try {
    const { rows } = await query(
      INVENTORY_ALLOCATION_MISMATCHED_IDS_QUERY,
      params,
      client
    );

    if (rows.length > 0) {
      logSystemWarn('Mismatched allocation IDs detected', {
        context,
        orderId,
        mismatches: rows.map((r) => r.id),
      });
    }

    return rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to validate allocation IDs against order.',
      meta: { orderId, allocationIds },
      logFn: (err) =>
        logDbQueryError(
          INVENTORY_ALLOCATION_MISMATCHED_IDS_QUERY,
          params,
          err,
          { context, orderId }
        ),
    });
  }
};

// ─── Review ───────────────────────────────────────────────────────────────────

/**
 * Fetches full allocation review data for a given order.
 *
 * CTE-based query — includes warehouse inventory aggregation, batch details,
 * order metadata, and packaging material joins.
 *
 * Returns an empty array if no allocations exist for the order.
 *
 * @param {string}     orderId       - UUID of the order.
 * @param {string[]}   warehouseIds  - Filter by warehouse UUIDs (empty = all warehouses).
 * @param {string[]}   allocationIds - Filter by allocation UUIDs (empty = all allocations).
 * @param {PoolClient} client        - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Allocation review rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getInventoryAllocationReview = async (
  orderId,
  warehouseIds,
  allocationIds,
  client
) => {
  const context = `${CONTEXT}/getInventoryAllocationReview`;
  const params = [orderId, warehouseIds, allocationIds];

  try {
    const { rows } = await query(
      INVENTORY_ALLOCATION_REVIEW_QUERY,
      params,
      client
    );
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch inventory allocation review.',
      meta: { orderId, warehouseIds },
      logFn: (err) =>
        logDbQueryError(INVENTORY_ALLOCATION_REVIEW_QUERY, params, err, {
          context,
          orderId,
        }),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated inventory allocations aggregated by order.
 *
 * Uses a two-level CTE — raw allocation filters applied in the inner CTE,
 * order-level filters applied in the outer WHERE. Params are concatenated
 * as [...rawAllocParams, ...outerParams] with a single shared paramIndexRef
 * so $N placeholders sequence correctly across both clause sets.
 *
 * Sort is resolved via `resolveSort` before being passed to `paginateQuery`.
 * A dedicated `countQuery` is provided to correctly count aggregated order
 * rows rather than raw allocation rows.
 *
 * @param {object}       options
 * @param {object}       [options.filters={}]               - Field filters (see buildInventoryAllocationFilter).
 * @param {number}       [options.page=1]                   - Page number (1-based).
 * @param {number}       [options.limit=10]                 - Records per page.
 * @param {string}       [options.sortBy='orderDate']       - camelCase sort map key (resolved via inventoryAllocationSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']         - Sort direction.
 *
 * @returns {Promise<PaginatedResult<InventoryAllocationRow>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPaginatedInventoryAllocations = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'orderDate',
  sortOrder = 'DESC',
}) => {
  const context = `${CONTEXT}/getPaginatedInventoryAllocations`;

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'inventoryAllocationSortMap',
    defaultSort: SORTABLE_FIELDS.inventoryAllocationSortMap.defaultNaturalSort,
  });

  const { rawAllocWhereClause, rawAllocParams, outerWhereClause, outerParams } =
    buildInventoryAllocationFilter(filters);

  const params = [...rawAllocParams, ...outerParams];

  const baseQuery = INVENTORY_ALLOCATION_BASE_QUERY(
    rawAllocWhereClause,
    outerWhereClause
  );

  const countQueryText = INVENTORY_ALLOCATION_COUNT_QUERY(
    rawAllocWhereClause,
    outerWhereClause
  );

  try {
    return await paginateQuery({
      queryText: baseQuery,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: INVENTORY_ALLOCATION_PAGINATED_SORT_WHITELIST,
      countQuery: countQueryText,
      meta: { filters, sortBy, sortOrder },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated inventory allocations.',
      meta: { filters, page, limit, sortBy, sortOrder },
      logFn: (err) =>
        logDbQueryError(baseQuery, params, err, {
          context,
          filters,
          page,
          limit,
        }),
    });
  }
};

// ─── By Order ─────────────────────────────────────────────────────────────────

/**
 * Fetches allocation records for a given order, optionally filtered by allocation IDs.
 *
 * Base query targets all allocations for the order. When allocationIds is provided,
 * an additional AND clause is appended to restrict to the specified IDs.
 *
 * @param {string}          orderId            - UUID of the order.
 * @param {string[]}        [allocationIds=[]] - Optional allocation UUIDs to filter by.
 * @param {PoolClient|null} [client=null]       - Optional DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Allocation rows for the order.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getAllocationsByOrderId = async (
  orderId,
  allocationIds = [],
  client = null
) => {
  const context = `${CONTEXT}/getAllocationsByOrderId`;

  let sql = INVENTORY_ALLOCATION_BY_ORDER_BASE;
  /** @type {(string | string[])[]} */
  const params = [orderId];

  if (Array.isArray(allocationIds) && allocationIds.length > 0) {
    sql += ` AND ia.id = ANY($2::uuid[])`;
    params.push(allocationIds);
  }

  try {
    const { rows } = await query(sql, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch allocations for order.',
      meta: { orderId, allocationIds },
      logFn: (err) => logDbQueryError(sql, params, err, { context, orderId }),
    });
  }
};

// ─── Statuses ─────────────────────────────────────────────────────────────────

/**
 * Fetches allocation statuses for a given order, optionally filtered by order item IDs.
 *
 * Base query targets all allocations for the order. When orderItemIds is provided,
 * an additional AND clause is appended to restrict to the specified items.
 *
 * @param {string}          orderId          - UUID of the order.
 * @param {string[]}        [orderItemIds=[]] - Optional order item UUIDs to filter by.
 * @param {PoolClient|null} [client=null]     - Optional DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Allocation status rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getAllocationStatuses = async (
  orderId,
  orderItemIds = [],
  client = null
) => {
  const context = `${CONTEXT}/getAllocationStatuses`;

  let sql = INVENTORY_ALLOCATION_STATUSES_BASE;
  /** @type {(string | string[])[]} */
  const params = [orderId];

  if (Array.isArray(orderItemIds) && orderItemIds.length > 0) {
    sql += ` AND ia.order_item_id = ANY($2::uuid[])`;
    params.push(orderItemIds);
  }

  try {
    const { rows } = await query(sql, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch allocation statuses for order.',
      meta: { orderId, orderItemIds },
      logFn: (err) => logDbQueryError(sql, params, err, { context, orderId }),
    });
  }
};

// ─── Existence Check ──────────────────────────────────────────────────────────

/**
 * Checks whether a SKU has any inventory allocations in an active status.
 *
 * Delegates to `existsQuery` which handles execution, logging, and error
 * normalization internally.
 *
 * @param {string}          skuId                    - UUID of the SKU to check.
 * @param {string[]}        activeAllocationStatusIds - UUIDs of active status records.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<boolean>} True if at least one active allocation exists.
 * @throws  {AppError}         If the query fails.
 */
const skuHasActiveAllocations = async (
  skuId,
  activeAllocationStatusIds,
  client = null
) => {
  const context = `${CONTEXT}/skuHasActiveAllocations`;

  return existsQuery(
    SKU_ACTIVE_ALLOCATIONS_QUERY,
    [skuId, activeAllocationStatusIds],
    context,
    'Failed to check SKU active allocation dependency',
    client
  );
};

module.exports = {
  insertInventoryAllocationsBulk,
  updateInventoryAllocationStatus,
  getMismatchedAllocationIds,
  getInventoryAllocationReview,
  getPaginatedInventoryAllocations,
  getAllocationsByOrderId,
  getAllocationStatuses,
  skuHasActiveAllocations,
};
