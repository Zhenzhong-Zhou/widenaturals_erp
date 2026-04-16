/**
 * @file warehouse-inventory-repository.js
 * @description Database access layer for warehouse inventory records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from warehouse-inventory-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedWarehouseInventory       — paginated inventory list scoped to a warehouse
 *  - insertWarehouseInventoryBulk         — bulk insert with upsert on warehouse + batch conflict
 *  - updateWarehouseInventoryQuantityBulk — bulk update warehouse and reserved quantities
 *  - updateWarehouseInventoryStatusBulk   — bulk update inventory status
 *  - updateWarehouseInventoryMetadata     — update inbound date and warehouse fee for a single record
 *  - updateWarehouseInventoryOutboundBulk — bulk record outbound movement and zero reserved quantity
 *  - fetchWarehouseInventoryStateByIds    — fetch quantity and status snapshot for pre-mutation validation
 *  - findExistingInventoryByBatchIds      — detect which batch IDs already have inventory records
 *  - getWarehouseInventoryDetailById      — fetch full detail record for a single inventory entry
 *  - getWarehouseSummary                  — aggregate quantity and fee totals for a warehouse
 *  - getWarehouseSummaryByStatus          — quantity totals grouped by inventory status
 *  - getWarehouseProductSummary           — quantity totals grouped by SKU for product batches
 *  - getWarehousePackagingSummary         — quantity totals grouped by packaging material
 */

'use strict';

const {
  query,
} = require('../database/db');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { bulkInsert } = require('../utils/db/write-utils');
const {
  logSystemWarn,
} = require('../utils/logging/system-logger');
const { existsQuery } = require('./utils/repository-helper');
const { buildWarehouseInventoryFilter } = require('../utils/sql/build-warehouse-inventory-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  buildWarehouseInventoryPaginatedQuery,
  WAREHOUSE_INVENTORY_TABLE,
  WAREHOUSE_INVENTORY_JOINS,
  WAREHOUSE_INVENTORY_SORT_WHITELIST,
  WAREHOUSE_INVENTORY_INSERT_COLUMNS,
  WAREHOUSE_INVENTORY_CONFLICT_COLUMNS,
  WAREHOUSE_INVENTORY_UPDATE_STRATEGIES,
  UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_QUANTITY_WITH_WAREHOUSE_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY,
  FETCH_WAREHOUSE_INVENTORY_STATE_QUERY,
  FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY,
  WAREHOUSE_INVENTORY_DETAIL_QUERY,
  WAREHOUSE_SUMMARY_QUERY,
  WAREHOUSE_SUMMARY_BY_STATUS_QUERY,
  WAREHOUSE_PRODUCT_SUMMARY_QUERY,
  WAREHOUSE_PACKAGING_SUMMARY_QUERY,
  GET_WAREHOUSE_INVENTORY_QUANTITIES_QUERY,
  ALLOCATABLE_BATCHES_SORT,
  buildAllocatableBatchesQuery,
  SKU_HAS_INVENTORY_QUERY,
} = require('./queries/warehouse-inventory-queries');
const { handleDbError } = require('../utils/errors/error-handlers');
const {
  logDbQueryError,
  logBulkInsertError
} = require('../utils/db-logger');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');

const CONTEXT = 'warehouse-inventory-repository';

/**
 * Fetches a paginated list of warehouse inventory records for a given warehouse,
 * with optional filters for status, SKU, product, inbound date range,
 * reservation state, and keyword search.
 *
 * @param {WarehouseInventoryFilters} filters
 * @param {number}  [page=1]
 * @param {number}  [limit=10]
 * @param {string}  [sortBy='inboundDate']
 * @param {string}  [sortOrder='DESC']
 *
 * @returns {Promise<PaginatedResult<WarehouseInventoryRow>>}
 *
 * @throws {AppError} Normalized database error if the query fails.
 */
const getPaginatedWarehouseInventory = async ({
                                                filters   = {},
                                                page      = 1,
                                                limit     = 10,
                                                sortBy    = 'inboundDate',
                                                sortOrder = 'DESC',
                                              }) => {
  const context = `${CONTEXT}/getPaginatedWarehouseInventory`;
  
  const { whereClause, params } = buildWarehouseInventoryFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'warehouseInventorySortMap',
    defaultSort: SORTABLE_FIELDS.warehouseInventorySortMap.defaultNaturalSort,
  });
  
  const queryText = buildWarehouseInventoryPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    WAREHOUSE_INVENTORY_TABLE,
      joins:        WAREHOUSE_INVENTORY_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: WAREHOUSE_INVENTORY_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated warehouse inventory records.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, page, limit }
      ),
    });
  }
};

// ── Insert / upsert (bulk) ──────────────────────────────────────────

/**
 * Bulk inserts warehouse inventory records, upserting on warehouse_id + batch_id conflict.
 *
 * @param {WarehouseInventoryInsertRecord[]} inventoryRecords
 * @param {PoolClient} client
 * @param {object}               [meta={}]
 * @returns {Promise<WarehouseInventoryRow[]>}
 * @throws {AppError} Normalized database error if the insert fails.
 */
const insertWarehouseInventoryBulk = async (inventoryRecords, client, meta = {}) => {
  if (!Array.isArray(inventoryRecords) || inventoryRecords.length === 0) return [];
  
  const context = `${CONTEXT}/insertWarehouseInventoryBulk`;
  
  const rows = inventoryRecords.map((record) => [
    record.warehouse_id,
    record.batch_id,
    record.warehouse_quantity,
    record.reserved_quantity   ?? 0,
    record.warehouse_fee       ?? 0,
    record.inbound_date,
    record.status_id,
    record.status_date         ?? null,
    record.created_by          ?? null,
    null,                                   // updated_at — null at insert time
    null,                                   // updated_by — null at insert time
  ]);
  
  validateBulkInsertRows(rows, WAREHOUSE_INVENTORY_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'warehouse_inventory',
      WAREHOUSE_INVENTORY_INSERT_COLUMNS,
      rows,
      WAREHOUSE_INVENTORY_CONFLICT_COLUMNS,
      WAREHOUSE_INVENTORY_UPDATE_STRATEGIES,
      client,
      { meta: { context, ...meta } },
      '*'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert warehouse inventory records.',
      meta:    { recordCount: inventoryRecords.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'warehouse_inventory',
        rows,
        rows.length,
        { context, conflictColumns: WAREHOUSE_INVENTORY_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ── Update quantity (bulk) ──────────────────────────────────────────

/**
 * Bulk updates warehouse quantity, reserved quantity, and inventory status
 * for a set of warehouse_inventory records.
 *
 * Each update row may optionally include a `warehouseId` to scope the UPDATE
 * to a specific warehouse — used by the adjust quantity API as an atomic ACL
 * guard. Omitting `warehouseId` matches by primary key only — used by the
 * allocation confirm flow where warehouse scope is enforced upstream.
 *
 * Records that do not match the WHERE condition are silently skipped —
 * callers should assert the returned row count if strict coverage is required.
 *
 * @param {WarehouseInventoryQuantityUpdate[]} updates    - Per-row update inputs.
 * @param {string}                             updatedBy  - UUID of the acting user.
 * @param {import('pg').PoolClient}            client     - Transaction client.
 * @returns {Promise<WarehouseInventoryRow[]>} Updated rows from RETURNING *.
 * @throws  {AppError} Normalized database error if any update fails.
 */
const updateWarehouseInventoryQuantityBulk = async (
  updates,
  updatedBy,
  client
) => {
  if (!Array.isArray(updates) || updates.length === 0) return [];
  
  const context = `${CONTEXT}/updateWarehouseInventoryQuantityBulk`;
  
  const results = [];
  
  try {
    for (const update of updates) {
      const withWarehouse = Boolean(update.warehouseId);
      
      const queryText = withWarehouse
        ? UPDATE_WAREHOUSE_INVENTORY_QUANTITY_WITH_WAREHOUSE_QUERY
        : UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY;
      
      const params = withWarehouse
        ? [update.warehouseQuantity, update.reservedQuantity, update.statusId, updatedBy, update.id, update.warehouseId]
        : [update.warehouseQuantity, update.reservedQuantity, update.statusId, updatedBy, update.id];
      
      const { rows } = await query(queryText, params, client);
      
      if (!rows[0]) {
        logSystemWarn('Warehouse inventory update matched no rows — possible warehouse ID mismatch or stale record', {
          context,
          inventoryId: update.id,
          warehouseId: update.warehouseId ?? null,
        });
      }
      
      if (rows[0]) results.push(rows[0]);
    }
    
    return results;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk update warehouse inventory quantities.',
      meta:    { updatedBy, updateCount: updates.length },
      logFn:   (err) => logDbQueryError(
        UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY, [], err,
        { context, updatedBy, updateCount: updates.length }
      ),
    });
  }
};

// ── Update status (bulk) ────────────────────────────────────────────

/**
 * Bulk updates inventory status for the given inventory record IDs.
 * Scoped to a single warehouse — records not matching warehouseId are silently skipped.
 *
 * @param {WarehouseInventoryStatusUpdate[]} updates
 * @param {string}   warehouseId
 * @param {string}   updatedBy
 * @param {PoolClient} client
 * @returns {Promise<WarehouseInventoryRow[]>}
 * @throws {AppError} Normalized database error if any update fails.
 */
const updateWarehouseInventoryStatusBulk = async (
  updates,
  warehouseId,
  updatedBy,
  client
) => {
  if (!Array.isArray(updates) || updates.length === 0) return [];
  
  const context = `${CONTEXT}/updateWarehouseInventoryStatusBulk`;
  
  const results = [];
  
  try {
    for (const update of updates) {
      const params = [
        update.statusId,
        updatedBy,
        update.id,
        warehouseId,
      ];
      
      const { rows } = await query(
        UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY, params, client
      );
      
      if (rows[0]) results.push(rows[0]);
    }
    
    return results;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk update warehouse inventory status.',
      meta:    { warehouseId, updateCount: updates.length },
      logFn:   (err) => logDbQueryError(
        UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY, [], err,
        { context, warehouseId, updateCount: updates.length }
      ),
    });
  }
};

// ── Update metadata (single) ────────────────────────────────────────

/**
 * Updates inbound date and warehouse fee for a single inventory record.
 * Fields default to their existing values via COALESCE if not provided.
 *
 * @param {WarehouseInventoryMetadataUpdate} update
 * @param {PoolClient} client
 * @returns {Promise<WarehouseInventoryRow|null>}
 * @throws {AppError} Normalized database error if the update fails.
 */
const updateWarehouseInventoryMetadata = async (update, client) => {
  const context = `${CONTEXT}/updateWarehouseInventoryMetadata`;
  
  const params = [
    update.inboundDate  ?? null,
    update.warehouseFee ?? null,
    update.updatedBy,
    update.id,
    update.warehouseId,
  ];
  
  try {
    const { rows } = await query(
      UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY, params, client
    );
    return rows[0] || null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update warehouse inventory metadata.',
      meta:    { id: update.id, warehouseId: update.warehouseId },
      logFn:   (err) => logDbQueryError(
        UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY, params, err, { context }
      ),
    });
  }
};

// ── Record outbound (bulk) ──────────────────────────────────────────

/**
 * Bulk records outbound movement — sets outbound date, final quantity, and zeroes reserved.
 * Scoped to a single warehouse — records not matching warehouseId are silently skipped.
 *
 * @param {WarehouseInventoryOutboundUpdate[]} updates
 * @param {string}   warehouseId
 * @param {string}   updatedBy
 * @param {PoolClient} client
 * @returns {Promise<WarehouseInventoryRow[]>}
 * @throws {AppError} Normalized database error if any update fails.
 */
const updateWarehouseInventoryOutboundBulk = async (
  updates,
  warehouseId,
  updatedBy,
  client
) => {
  if (!Array.isArray(updates) || updates.length === 0) return [];
  
  const context = `${CONTEXT}/updateWarehouseInventoryOutboundBulk`;
  
  const results = [];
  
  try {
    for (const update of updates) {
      const params = [
        update.outboundDate,
        update.warehouseQuantity,
        updatedBy,
        update.id,
        warehouseId,
      ];
      
      const { rows } = await query(
        UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY, params, client
      );
      
      if (rows[0]) results.push(rows[0]);
    }
    
    return results;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk record warehouse inventory outbound.',
      meta:    { warehouseId, updateCount: updates.length },
      logFn:   (err) => logDbQueryError(
        UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY, [], err,
        { context, warehouseId, updateCount: updates.length }
      ),
    });
  }
};

// ── Fetch previous state ────────────────────────────────────────────

/**
 * Fetches the current quantity and status snapshot for a set of inventory record IDs.
 * Used for pre-mutation state validation before bulk quantity or status updates.
 *
 * @param {string[]}               ids
 * @param {string}                 warehouseId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<{ id: string, warehouse_quantity: number, reserved_quantity: number, status_id: string }[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const fetchWarehouseInventoryStateByIds = async (ids, warehouseId, client) => {
  const context = `${CONTEXT}/fetchWarehouseInventoryStateByIds`;
  
  const params = [ids, warehouseId];
  
  try {
    const { rows } = await query(
      FETCH_WAREHOUSE_INVENTORY_STATE_QUERY, params, client
    );
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse inventory state.',
      meta:    { warehouseId, idCount: ids.length },
      logFn:   (err) => logDbQueryError(
        FETCH_WAREHOUSE_INVENTORY_STATE_QUERY, params, err, { context }
      ),
    });
  }
};

// ── Find existing inventory by batch IDs ────────────────────────────

/**
 * Returns the batch IDs that already have an inventory record in the given warehouse.
 * Used to detect duplicates before bulk insert.
 *
 * @param {string}                 warehouseId
 * @param {string[]}               batchIds
 * @param {import('pg').PoolClient} client
 * @returns {Promise<{ batch_id: string }[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const findExistingInventoryByBatchIds = async (warehouseId, batchIds, client) => {
  const context = `${CONTEXT}/findExistingInventoryByBatchIds`;
  
  const params = [warehouseId, batchIds];
  
  try {
    const { rows } = await query(
      FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY, params, client
    );
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check existing inventory by batch IDs.',
      meta:    { warehouseId, batchCount: batchIds.length },
      logFn:   (err) => logDbQueryError(
        FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY, params, err, { context }
      ),
    });
  }
};

// ── Get detail by ID ────────────────────────────────────────────────

/**
 * Fetches the full detail record for a single warehouse inventory entry.
 * Returns null if no record matches — caller is responsible for the not-found check.
 *
 * @param {string} inventoryId
 * @param {string} warehouseId
 * @returns {Promise<WarehouseInventoryDetailRow|null>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseInventoryDetailById = async (inventoryId, warehouseId) => {
  const context = `${CONTEXT}/getWarehouseInventoryDetailById`;
  
  const params = [inventoryId, warehouseId];
  
  try {
    const { rows } = await query(WAREHOUSE_INVENTORY_DETAIL_QUERY, params);
    return rows[0] || null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse inventory detail.',
      meta:    { inventoryId, warehouseId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_INVENTORY_DETAIL_QUERY, params, err, { context }
      ),
    });
  }
};

// ── Summary ─────────────────────────────────────────────────────────

/**
 * Fetches aggregate quantity and fee totals for a given warehouse.
 * Returns null if the warehouse has no inventory records.
 *
 * @param {string} warehouseId
 * @returns {Promise<WarehouseSummaryRow|null>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseSummary = async (warehouseId) => {
  const context = `${CONTEXT}/getWarehouseSummary`;
  const params = [warehouseId];
  
  try {
    const { rows } = await query(WAREHOUSE_SUMMARY_QUERY, params);
    return rows[0] || null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse summary.',
      meta:    { warehouseId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_SUMMARY_QUERY, params, err, { context }
      ),
    });
  }
};

/**
 * Fetches quantity totals grouped by inventory status for a given warehouse.
 *
 * @param {string} warehouseId
 * @returns {Promise<WarehouseSummaryByStatusRow[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseSummaryByStatus = async (warehouseId) => {
  const context = `${CONTEXT}/getWarehouseSummaryByStatus`;
  const params = [warehouseId];
  
  try {
    const { rows } = await query(WAREHOUSE_SUMMARY_BY_STATUS_QUERY, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse summary by status.',
      meta:    { warehouseId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_SUMMARY_BY_STATUS_QUERY, params, err, { context }
      ),
    });
  }
};

// ── Item summary ────────────────────────────────────────────────────

/**
 * Fetches quantity totals grouped by SKU for all product batches in a given warehouse.
 *
 * @param {string} warehouseId
 * @returns {Promise<WarehouseProductSummaryRow[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseProductSummary = async (warehouseId) => {
  const context = `${CONTEXT}/getWarehouseProductSummary`;
  const params = [warehouseId];
  
  try {
    const { rows } = await query(WAREHOUSE_PRODUCT_SUMMARY_QUERY, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse product summary.',
      meta:    { warehouseId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_PRODUCT_SUMMARY_QUERY, params, err, { context }
      ),
    });
  }
};

/**
 * Fetches quantity totals grouped by packaging material for all packaging batches in a given warehouse.
 *
 * @param {string} warehouseId
 * @returns {Promise<WarehousePackagingSummaryRow[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehousePackagingSummary = async (warehouseId) => {
  const context = `${CONTEXT}/getWarehousePackagingSummary`;
  const params = [warehouseId];
  
  try {
    const { rows } = await query(WAREHOUSE_PACKAGING_SUMMARY_QUERY, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse packaging summary.',
      meta:    { warehouseId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_PACKAGING_SUMMARY_QUERY, params, err, { context }
      ),
    });
  }
};

/**
 * Fetches warehouse inventory quantity snapshots for a set of (warehouse, batch) key pairs.
 *
 * Uses `unnest($1::uuid[], $2::uuid[])` to match exact pairs positionally —
 * avoids dynamic SQL construction and correctly excludes cross-joins.
 *
 * If fewer rows are returned than keys provided, a warning is emitted for
 * each missing pair — callers should use `assertInventoryCoverage` if
 * missing records are unacceptable.
 *
 * @param {Array<{ warehouse_id: string, batch_id: string }>} keys     - Pairs to fetch.
 * @param {import('pg').PoolClient}                           client   - Transaction client.
 * @returns {Promise<WarehouseInventoryQuantityRow[]>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getWarehouseInventoryQuantities = async (keys, client) => {
  const context = `${CONTEXT}/getWarehouseInventoryQuantities`;
  
  if (!Array.isArray(keys) || keys.length === 0) return [];
  
  const warehouseIds = keys.map((k) => k.warehouse_id);
  const batchIds     = keys.map((k) => k.batch_id);
  const params       = [warehouseIds, batchIds];
  
  try {
    const result = await query(
      GET_WAREHOUSE_INVENTORY_QUANTITIES_QUERY,
      params,
      client
    );
    
    if (result.rows.length !== keys.length) {
      const missingKeys = keys.filter(
        ({ warehouse_id, batch_id }) =>
          !result.rows.some(
            (row) =>
              row.warehouse_id === warehouse_id &&
              row.batch_id     === batch_id
          )
      );
      
      logSystemWarn('Some warehouse_inventory records not found', {
        context,
        missingKeys,
        expected: keys.length,
        found:    result.rows.length,
      });
    }
    
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse inventory quantities.',
      meta:    { keyCount: keys.length },
      logFn:   (err) => logDbQueryError(
        GET_WAREHOUSE_INVENTORY_QUANTITIES_QUERY,
        params,
        err,
        { context, keyCount: keys.length }
      ),
    });
  }
};

/**
 * Fetches allocatable inventory batches from a specific warehouse for a set of
 * SKU IDs and packaging material IDs.
 *
 * Only batches meeting all of the following conditions are returned:
 *  - belong to the specified warehouse
 *  - have positive warehouse quantity (`warehouse_quantity > 0`)
 *  - match the specified inventory status ID (typically `inventory_in_stock`)
 *  - match at least one of the provided SKU IDs or packaging material IDs
 *
 * Results are ordered by the specified allocation strategy:
 *  - `fefo` (default) — `expiry_date ASC NULLS LAST`
 *  - `fifo`           — `inbound_date ASC NULLS LAST`
 *
 * Ordering is applied via a whitelisted static query — `options.strategy` is
 * never interpolated directly into SQL.
 *
 * @param {object}   allocationFilter
 * @param {string[]} allocationFilter.skuIds                - SKU UUIDs eligible for allocation.
 * @param {string[]} allocationFilter.packagingMaterialIds  - Packaging material UUIDs eligible for allocation.
 * @param {string}   allocationFilter.warehouseId           - Warehouse UUID to fetch inventory from.
 * @param {string}   allocationFilter.inventoryStatusId     - Inventory status UUID (e.g. `inventory_in_stock`).
 * @param {object}              [options={}]
 * @param {'fefo'|'fifo'}       [options.strategy='fefo']   - Batch ordering strategy.
 * @param {import('pg').PoolClient} client                  - Transaction client.
 * @returns {Promise<AllocatableBatch[]>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getAllocatableBatchesByWarehouse = async (
  allocationFilter = {},
  options = {},
  client
) => {
  const context = `${CONTEXT}/getAllocatableBatchesByWarehouse`;
  
  const {
    skuIds               = [],
    packagingMaterialIds = [],
    warehouseId,
    inventoryStatusId,
  } = allocationFilter;
  
  const orderByClause = ALLOCATABLE_BATCHES_SORT[options.strategy]
    ?? ALLOCATABLE_BATCHES_SORT.fefo;
  
  const queryText = buildAllocatableBatchesQuery(orderByClause);
  const params    = [warehouseId, inventoryStatusId, skuIds, packagingMaterialIds];
  
  try {
    const result = await query(queryText, params, client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch allocatable warehouse inventory batches.',
      meta:    { warehouseId, skuCount: skuIds.length, packagingMaterialCount: packagingMaterialIds.length },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, warehouseId }
      ),
    });
  }
};

/**
 * Checks whether a SKU currently has inventory records.
 *
 * Determines if any warehouse inventory entries exist that are
 * linked to the given SKU via:
 *
 * warehouse_inventory → batch_registry → product_batches
 *
 * This is used by higher-level business guards to prevent
 * destructive operations (e.g., archive/delete) when inventory exists.
 *
 * @param {string} skuId - UUID of the SKU.
 * @param {PoolClient|null} [client]
 *   Optional transactional client.
 *
 * @returns {Promise<boolean>}
 *   Returns true if at least one inventory record exists,
 *   false otherwise.
 *
 * @throws {AppError.databaseError}
 *   If the database query fails.
 */
const skuHasInventory = async (skuId, client = null) => {
  const context = `${CONTEXT}/skuHasInventory`;
  
  return existsQuery(
    SKU_HAS_INVENTORY_QUERY,
    [skuId],
    context,
    'Failed to check SKU inventory dependency',
    client
  );
};

module.exports = {
  getPaginatedWarehouseInventory,
  insertWarehouseInventoryBulk,
  updateWarehouseInventoryQuantityBulk,
  updateWarehouseInventoryStatusBulk,
  updateWarehouseInventoryMetadata,
  updateWarehouseInventoryOutboundBulk,
  fetchWarehouseInventoryStateByIds,
  findExistingInventoryByBatchIds,
  getWarehouseInventoryDetailById,
  getWarehouseSummary,
  getWarehouseSummaryByStatus,
  getWarehouseProductSummary,
  getWarehousePackagingSummary,
  getWarehouseInventoryQuantities,
  getAllocatableBatchesByWarehouse,
  skuHasInventory,
};
