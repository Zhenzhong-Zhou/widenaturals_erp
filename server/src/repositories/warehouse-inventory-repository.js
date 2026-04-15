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
 */

'use strict';

const {
  query,
} = require('../database/db');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { bulkInsert } = require('../utils/db/write-utils');
const AppError = require('../utils/AppError');
const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
} = require('../utils/logging/system-logger');
const { logError } = require('../utils/logging/logger-helper');
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
  UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY,
  FETCH_WAREHOUSE_INVENTORY_STATE_QUERY,
  FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY,
  WAREHOUSE_INVENTORY_DETAIL_QUERY
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
 * Bulk updates warehouse and reserved quantities for the given inventory record IDs.
 * Scoped to a single warehouse — records not matching warehouseId are silently skipped.
 *
 * @param {WarehouseInventoryQuantityUpdate[]} updates
 * @param {string}   warehouseId
 * @param {string}   updatedBy
 * @param {PoolClient} client
 * @returns {Promise<WarehouseInventoryRow[]>}
 * @throws {AppError} Normalized database error if any update fails.
 */
const updateWarehouseInventoryQuantityBulk = async (
  updates,
  warehouseId,
  updatedBy,
  client
) => {
  if (!Array.isArray(updates) || updates.length === 0) return [];
  
  const context = `${CONTEXT}/updateWarehouseInventoryQuantityBulk`;
  
  const results = [];
  
  try {
    for (const update of updates) {
      const params = [
        update.warehouseQuantity,
        update.reservedQuantity,
        updatedBy,
        update.id,
        warehouseId,
      ];
      
      const { rows } = await query(
        UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY, params, client
      );
      
      if (rows[0]) results.push(rows[0]);
    }
    
    return results;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to bulk adjust warehouse inventory quantities.',
      meta:    { warehouseId, updateCount: updates.length },
      logFn:   (err) => logDbQueryError(
        UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY, [], err,
        { context, warehouseId, updateCount: updates.length }
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

/**
 * Fetches multiple `warehouse_inventory` rows using composite keys (`warehouse_id`, `batch_id`).
 *
 * For each input pair, attempts to retrieve the corresponding inventory record from the database.
 * If any expected records are missing, a system warning will be logged.
 * This function is useful when verifying current stock and reservation state across multiple batches.
 *
 * Logs:
 * - Warns when one or more requested rows are not found.
 * - Logs structured exception info on query failure.
 *
 * @param {Array<{ warehouse_id: string, batch_id: string }>} keys - Composite keys to fetch.
 * @param {PoolClient} client - PostgreSQL client used for the transaction.
 * @returns {Promise<Array<{
 *   id: string,
 *   warehouse_id: string,
 *   batch_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity: number,
 *   status_id: string
 * }>>} - Matching inventory records.
 *
 * @throws {AppError} - If a database error occurs.
 */
const getWarehouseInventoryQuantities = async (keys, client) => {
  const sql = `
    SELECT id, warehouse_id, batch_id, warehouse_quantity, reserved_quantity, status_id
    FROM warehouse_inventory
    WHERE ${keys
      .map(
        (_, i) => `(warehouse_id = $${i * 2 + 1} AND batch_id = $${i * 2 + 2})`
      )
      .join(' OR ')}
  `;
  const params = keys.flatMap(({ warehouse_id, batch_id }) => [
    warehouse_id,
    batch_id,
  ]);

  try {
    const result = await query(sql, params, client);

    if (result.rows.length !== keys.length) {
      const missingKeys = keys.filter(
        ({ warehouse_id, batch_id }) =>
          !result.rows.some(
            (row) =>
              row.warehouse_id === warehouse_id && row.batch_id === batch_id
          )
      );
      logSystemWarn('Missing warehouse_inventory records detected', {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryQuantities',
        missingKeys,
        expected: keys.length,
        found: result.rows.length,
      });
    }

    if (result.rows.length !== keys.length) {
      logSystemWarn('Some warehouse_inventory records not found', {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryQuantities',
        expected: keys.length,
        found: result.rows.length,
      });
    }

    return result.rows;
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch multiple warehouse_inventory records',
      {
        context:
          'warehouse-inventory-repository/getWarehouseInventoryQuantities',
        keys,
      }
    );
    throw AppError.databaseError('Failed to fetch warehouse inventory records');
  }
};

/**
 * Fetches allocatable inventory batches from a specific warehouse.
 *
 * This query retrieves batch-level inventory records from `warehouse_inventory`
 * and joins related batch metadata from `batch_registry`, `product_batches`,
 * and `packaging_material_batches`. The result provides a unified batch view
 * regardless of whether the batch belongs to:
 *
 * - a product SKU
 * - a packaging material
 *
 * Only batches that meet the following conditions are returned:
 * - belong to the specified warehouse
 * - have positive available quantity (`warehouse_quantity > 0`)
 * - match the specified inventory status (e.g., `inventory_in_stock`)
 * - match the provided SKU IDs or packaging material IDs
 *
 * Allocation strategies can optionally be applied to control batch ordering:
 *
 * - **FIFO**: sorts by `inbound_date`
 * - **FEFO**: sorts by `expiry_date`
 *
 * The ordering determines how batches are consumed during inventory allocation.
 *
 * @param {Object} allocationFilter - Filter criteria for the allocation query.
 * @param {string[]} allocationFilter.skuIds - List of SKU IDs eligible for allocation.
 * @param {string[]} allocationFilter.packagingMaterialIds - List of packaging material IDs eligible for allocation.
 * @param {string} allocationFilter.warehouseId - Warehouse ID to fetch inventory from.
 * @param {string} allocationFilter.inventoryStatusId - Inventory status ID (e.g. `inventory_in_stock`).
 *
 * @param {Object} [options={}] - Optional allocation configuration.
 * @param {'fifo'|'fefo'} [options.strategy] - Batch ordering strategy applied before allocation.
 *
 * @param {Object} [client] - Optional PostgreSQL client used for transactional execution.
 *
 * @returns {Promise<Array<Object>>} Resolves to a list of allocatable batch records.
 *
 * Each returned row contains:
 * - `batch_id`
 * - `warehouse_id`
 * - `warehouse_name`
 * - `warehouse_quantity`
 * - `reserved_quantity`
 * - `expiry_date`
 * - `lot_number`
 * - `batch_type`
 * - `sku_id` (if product batch)
 * - `packaging_material_id` (if packaging batch)
 *
 * @throws {AppError} If the database query fails.
 */
const getAllocatableBatchesByWarehouse = async (
  allocationFilter = {},
  options = {},
  client
) => {
  const {
    skuIds = [],
    packagingMaterialIds = [],
    warehouseId,
    inventoryStatusId,
  } = allocationFilter;

  const orderByField =
    options.strategy === 'fefo'
      ? 'expiry_date'
      : options.strategy === 'fifo'
        ? 'inbound_date'
        : null;

  const orderByClause = orderByField ? `ORDER BY ${orderByField} ASC` : '';

  const sql = `
    SELECT
      wi.batch_id,
      wi.warehouse_id,
      w.name AS warehouse_name,
      wi.warehouse_quantity,
      wi.reserved_quantity,
      COALESCE(pb.expiry_date, pmb.expiry_date) AS expiry_date,
      COALESCE(pb.lot_number, pmb.lot_number) AS lot_number,
      br.batch_type,
      pb.sku_id,
      pm.id AS packaging_material_id
    FROM warehouse_inventory wi
    JOIN warehouses w ON wi.warehouse_id = w.id
    JOIN batch_registry br ON wi.batch_id = br.id
    LEFT JOIN product_batches pb ON br.product_batch_id = pb.id
    LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
    LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
    LEFT JOIN packaging_materials pm ON pms.packaging_material_id = pm.id
    WHERE wi.warehouse_id = $1
      AND wi.warehouse_quantity > 0
      AND wi.status_id = $2
      AND (
        (pb.sku_id = ANY($3::uuid[]) AND pb.sku_id IS NOT NULL)
        OR
        (pm.id = ANY($4::uuid[]) AND pm.id IS NOT NULL)
      )
    ${orderByClause}
  `;

  try {
    const result = await query(
      sql,
      [warehouseId, inventoryStatusId, skuIds, packagingMaterialIds],
      client
    );

    logSystemInfo('Fetched allocatable batches by warehouse', {
      context: 'inventory-repository/getAllocatableBatchesByWarehouse',
      warehouseId,
      skuCount: skuIds.length,
      packagingMaterialCount: packagingMaterialIds.length,
      strategy: options.strategy ?? 'none',
      rowCount: result?.rows?.length ?? 0,
      severity: 'INFO',
    });

    return result.rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch allocatable batches', {
      context: 'inventory-repository/getAllocatableBatchesByWarehouse',
      warehouseId,
      skuIds,
      packagingMaterialIds,
      strategy: options.strategy ?? 'none',
      severity: 'ERROR',
    });

    throw AppError.databaseError(
      'Unable to retrieve allocatable warehouse inventory.'
    );
  }
};

/**
 * Retrieves recently inserted warehouse inventory records based on warehouse lot IDs.
 *
 * @param {string[]} warehouseLotIds - An array of warehouse lot IDs.
 * @returns {Promise<Array<{
 *   warehouse_id: string,
 *   warehouse_name: string,
 *   total_records: number,
 *   inventory_records: Array<{
 *     warehouse_lot_id: string,
 *     inventory_id: string,
 *     location_id: string,
 *     quantity: number,
 *     product_name: string,
 *     identifier: string,
 *     inserted_quantity: number,
 *     available_quantity: number,
 *     lot_number: string,
 *     expiry_date: string | null,
 *     manufacture_date: string | null,
 *     inbound_date: string | null,
 *     inventory_created_at: string,
 *     inventory_created_by: string,
 *     inventory_updated_at: string,
 *     inventory_updated_by: string
 *   }>
 * }>>} - Returns an array of warehouse inventory records, grouped by warehouse, including product and lot details.
 * @throws {Error} - Throws an error if the database query fails.
 */
const getRecentInsertWarehouseInventoryRecords = async (warehouseLotIds) => {
  const queryText = `
    WITH lots_data AS (
      SELECT
        wil.id AS warehouse_lot_id,
        wil.warehouse_id,
        wil.inventory_id,
        i.location_id,
        i.quantity AS inventory_qty,
        wil.quantity AS lot_qty,
        wil.reserved_quantity AS reserved_qty,
        wil.lot_number,
        wil.expiry_date,
        wil.manufacture_date,
        wil.created_at AS lot_created_at,
        COALESCE(u1.firstname, '') || ' ' || COALESCE(u1.lastname, 'Unknown') AS lot_created_by,
        wil.updated_at AS lot_updated_at,
        COALESCE(u2.firstname, '') || ' ' || COALESCE(u2.lastname, 'Unknown') AS lot_updated_by,
        wi.available_quantity,
        p.product_name,
        i.identifier,
        i.product_id
      FROM warehouse_inventory_lots wil
      JOIN inventory i ON wil.inventory_id = i.id
      JOIN warehouse_inventory wi ON wil.inventory_id = wi.inventory_id
                                   AND wil.warehouse_id = wi.warehouse_id
      LEFT JOIN users u1 ON wil.created_by = u1.id
      LEFT JOIN users u2 ON wil.updated_by = u2.id
      LEFT JOIN products p ON i.product_id = p.id
      WHERE wil.id = ANY($1::uuid[])
    )
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      COUNT(ld.warehouse_lot_id) AS total_records,
      json_agg(
        jsonb_strip_nulls(
          jsonb_build_object(
            'warehouse_lot_id', ld.warehouse_lot_id,
            'inventory_id', ld.inventory_id,
            'location_id', ld.location_id,
            'inventory_qty', ld.inventory_qty,
            'lot_qty', ld.lot_qty,
            'lot_reserved_quantity', ld.reserved_qty,
            'inserted_quantity', i.quantity,
            'available_quantity', ld.available_quantity,
            'lot_number', ld.lot_number,
            'expiry_date', ld.expiry_date,
            'manufacture_date', ld.manufacture_date,
            'inbound_date', i.inbound_date,
            'lot_created_at', ld.lot_created_at,
            'lot_created_by', ld.lot_created_by,
            'lot_updated_at', ld.lot_updated_at,
            'lot_updated_by', ld.lot_updated_by
          ) ||
          CASE
            WHEN ld.product_id IS NOT NULL
              THEN jsonb_build_object('product_name', ld.product_name)
            ELSE jsonb_build_object('identifier', COALESCE(ld.identifier, 'Unknown Item'))
          END
        )
      ) AS inventory_records
    FROM lots_data ld
    JOIN warehouses w ON ld.warehouse_id = w.id
    JOIN inventory i ON ld.inventory_id = i.id
    GROUP BY w.id, w.name;
  `;

  try {
    const { rows } = await query(queryText, [warehouseLotIds]);
    return rows;
  } catch (error) {
    logError('Error executing inventory query:', error);
    throw error;
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
  const context = 'warehouse-inventory-repository/skuHasInventory';

  const queryText = `
    SELECT 1
    FROM warehouse_inventory wi
    JOIN batch_registry br
      ON wi.batch_id = br.id
    JOIN product_batches pb
      ON br.product_batch_id = pb.id
    WHERE pb.sku_id = $1
    LIMIT 1
  `;

  return existsQuery(
    queryText,
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
  getWarehouseInventoryQuantities,
  getAllocatableBatchesByWarehouse,
  getRecentInsertWarehouseInventoryRecords,
  skuHasInventory,
};
