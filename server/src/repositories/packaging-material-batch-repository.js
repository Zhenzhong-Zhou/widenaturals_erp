/**
 * @file packaging-material-batch-repository.js
 * @description Database access layer for packaging material batch records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from packaging-material-batch-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedPackagingMaterialBatches    — paginated list with filtering and sorting
 *  - insertPackagingMaterialBatchesBulk     — bulk upsert with conflict resolution
 *  - getPackagingMaterialBatchById          — fetch single batch by id
 *  - updatePackagingMaterialBatch           — partial update via updateById
 *  - getPackagingMaterialBatchDetailsById   — full detail fetch with material and supplier joins
 */

'use strict';

const { query } = require('../database/db');
const { bulkInsert, updateById } = require('../utils/db/write-utils');
const {
  validateBulkInsertRows,
} = require('../utils/validation/bulk-insert-row-validator');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const {
  buildPackagingMaterialBatchFilter,
} = require('../utils/sql/build-packaging-material-batch-filter');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const { resolveSort } = require('../utils/query/sort-resolver');
const {
  PMB_INSERT_COLUMNS,
  PMB_CONFLICT_COLUMNS,
  PMB_UPDATE_STRATEGIES,
  PMB_TABLE,
  PMB_JOINS,
  PMB_SORT_WHITELIST,
  buildPmbPaginatedQuery,
  PMB_GET_BY_ID_QUERY,
  PMB_GET_DETAILS_BY_ID_QUERY,
} = require('./queries/packaging-material-batch-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated packaging material batch records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=20]             - Records per page.
 * @param {string}       [options.sortBy='receivedAt']  - Sort key (mapped via packagingMaterialBatchSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedPackagingMaterialBatches = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'receivedAt',
  sortOrder = 'DESC',
}) => {
  const context =
    'packaging-material-batch-repository/getPaginatedPackagingMaterialBatches';

  const { whereClause, params } = buildPackagingMaterialBatchFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'packagingMaterialBatchSortMap',
    defaultSort:
      SORTABLE_FIELDS.packagingMaterialBatchSortMap.defaultNaturalSort,
  });

  const queryText = buildPmbPaginatedQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: PMB_TABLE,
      joins: PMB_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: PMB_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated packaging material batches.',
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

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates packaging material batch records.
 *
 * On conflict matching packaging_material_supplier_id + lot_number,
 * overwrites mutable fields including quantity, cost, and status.
 *
 * @param {Array<Object>}              packagingMaterialBatches - Validated batch objects to insert.
 * @param {PoolClient}    client                   - DB client for transactional context.
 * @param {Object}                     [meta={}]                - Optional caller context for tracing.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated batch records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertPackagingMaterialBatchesBulk = async (
  packagingMaterialBatches,
  client,
  meta = {}
) => {
  if (
    !Array.isArray(packagingMaterialBatches) ||
    packagingMaterialBatches.length === 0
  )
    return [];

  const context =
    'packaging-material-batch-repository/insertPackagingMaterialBatchesBulk';

  const rows = packagingMaterialBatches.map((batch) => [
    batch.packaging_material_supplier_id,
    batch.lot_number,
    batch.material_snapshot_name ?? null,
    batch.received_label_name ?? null,
    batch.quantity,
    batch.unit,
    batch.manufacture_date ?? null,
    batch.expiry_date ?? null,
    batch.unit_cost ?? null,
    batch.currency ?? null,
    batch.exchange_rate ?? null,
    batch.total_cost ?? null,
    batch.status_id,
    null, // received_at — set on receipt, not creation
    null, // received_by — set on receipt, not creation
    batch.created_by ?? null,
    null, // updated_at — null at insert time
    null, // updated_by — null at insert time
  ]);

  validateBulkInsertRows(rows, PMB_INSERT_COLUMNS.length);

  try {
    return await bulkInsert(
      'packaging_material_batches',
      PMB_INSERT_COLUMNS,
      rows,
      PMB_CONFLICT_COLUMNS,
      PMB_UPDATE_STRATEGIES,
      client,
      { meta: { context, ...meta } },
      '*'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert packaging material batch records.',
      meta: { batchCount: packagingMaterialBatches.length },
      logFn: (err) =>
        logBulkInsertError(
          err,
          'packaging_material_batches',
          rows,
          rows.length,
          { context, conflictColumns: PMB_CONFLICT_COLUMNS }
        ),
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single packaging material batch by ID.
 *
 * Returns null if no batch exists for the given ID.
 *
 * @param {string}                  batchId - UUID of the batch.
 * @param {PoolClient} client  - DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Batch row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getPackagingMaterialBatchById = async (batchId, client) => {
  const context =
    'packaging-material-batch-repository/getPackagingMaterialBatchById';

  try {
    const { rows } = await query(PMB_GET_BY_ID_QUERY, [batchId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch packaging material batch.',
      meta: { batchId },
      logFn: (err) =>
        logDbQueryError(PMB_GET_BY_ID_QUERY, [batchId], err, {
          context,
          batchId,
        }),
    });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Performs a partial update on a packaging material batch record.
 *
 * Delegates to `updateById` which handles metadata injection
 * (updated_at, updated_by) and error normalization internally.
 *
 * @param {Object}                  params
 * @param {string}                  params.batchId   - UUID of the batch to update.
 * @param {string}                  params.updatedBy - UUID of the user performing the update.
 * @param {PoolClient} client           - DB client for transactional context.
 *
 * @returns {Promise<{ id: string }>} The updated batch ID.
 * @throws  {AppError}                If the batch does not exist or the update fails.
 */
const updatePackagingMaterialBatch = async (params, client) => {
  const {
    batchId,
    packaging_material_supplier_id,
    lot_number,
    material_snapshot_name,
    received_label_name,
    quantity,
    unit,
    manufacture_date,
    expiry_date,
    unit_cost,
    currency,
    exchange_rate,
    total_cost,
    notes,
    status_id,
    received_at,
    received_by,
    updatedBy,
  } = params;

  const updates = {
    packaging_material_supplier_id,
    lot_number,
    material_snapshot_name,
    received_label_name,
    quantity,
    unit,
    manufacture_date,
    expiry_date,
    unit_cost,
    currency,
    exchange_rate,
    total_cost,
    notes,
    status_id,
    received_at,
    received_by,
  };

  return await updateById(
    'packaging_material_batches',
    batchId,
    updates,
    updatedBy,
    client
  );
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full packaging material batch detail by ID.
 *
 * Includes material, supplier, status, and received_by user fields.
 * Returns null if no batch exists for the given ID.
 *
 * @param {string} batchId - UUID of the batch.
 *
 * @returns {Promise<Object|null>} Full batch detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getPackagingMaterialBatchDetailsById = async (batchId) => {
  const context =
    'packaging-material-batch-repository/getPackagingMaterialBatchDetailsById';

  try {
    const { rows } = await query(PMB_GET_DETAILS_BY_ID_QUERY, [batchId]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch packaging material batch detail.',
      meta: { batchId },
      logFn: (err) =>
        logDbQueryError(PMB_GET_DETAILS_BY_ID_QUERY, [batchId], err, {
          context,
          batchId,
        }),
    });
  }
};

module.exports = {
  getPaginatedPackagingMaterialBatches,
  insertPackagingMaterialBatchesBulk,
  getPackagingMaterialBatchById,
  updatePackagingMaterialBatch,
  getPackagingMaterialBatchDetailsById,
};
