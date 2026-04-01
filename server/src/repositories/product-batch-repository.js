/**
 * @file product-batch-repository.js
 * @description Database access layer for product batch records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from product-batch-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedProductBatches    — paginated list with filtering and sorting
 *  - insertProductBatchesBulk      — bulk upsert with conflict resolution
 *  - getProductBatchById           — fetch single batch by id
 *  - updateProductBatch            — partial update via updateById
 *  - getProductBatchDetailsById    — full detail fetch with product and manufacturer joins
 */

'use strict';

const { bulkInsert, updateById, query } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { paginateQuery } = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { buildProductBatchFilter } = require('../utils/sql/build-product-batch-filter');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const { resolveSort } = require('../utils/query/sort-resolver');
const {
  PB_INSERT_COLUMNS,
  PB_CONFLICT_COLUMNS,
  PB_UPDATE_STRATEGIES,
  PB_TABLE,
  PB_JOINS,
  PB_SORT_WHITELIST,
  buildPbPaginatedQuery,
  PB_GET_BY_ID_QUERY,
  PB_GET_DETAILS_BY_ID_QUERY,
} = require('./queries/product-batch-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated product batch records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]          - Field filters.
 * @param {number}       [options.page=1]              - Page number (1-based).
 * @param {number}       [options.limit=20]            - Records per page.
 * @param {string}       [options.sortBy='expiryDate'] - Sort key (mapped via productBatchSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedProductBatches = async ({
                                            filters   = {},
                                            page      = 1,
                                            limit     = 20,
                                            sortBy    = 'expiryDate',
                                            sortOrder = 'ASC',
                                          }) => {
  const context = 'product-batch-repository/getPaginatedProductBatches';
  
  const { whereClause, params } = buildProductBatchFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'productBatchSortMap',
    defaultSort: SORTABLE_FIELDS.productBatchSortMap.defaultNaturalSort,
  });
  
  const queryText = buildPbPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    PB_TABLE,
      joins:        PB_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: PB_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated product batches.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, page, limit }
      ),
    });
  }
};

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates product batch records.
 *
 * On conflict matching lot_number + sku_id, applies field-level strategies:
 * notes and status overwritten; received/released fields preserved.
 *
 * @param {Array<Object>}              productBatches - Validated batch objects to insert.
 * @param {PoolClient}    client         - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or updated batch records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertProductBatchesBulk = async (productBatches, client) => {
  if (!Array.isArray(productBatches) || productBatches.length === 0) return [];
  
  const context = 'product-batch-repository/insertProductBatchesBulk';
  
  const rows = productBatches.map((batch) => [
    batch.lot_number,
    batch.sku_id,
    batch.manufacturer_id,
    batch.manufacture_date,
    batch.expiry_date,
    null,                                 // received_at — set on receipt, not creation
    null,                                 // received_by — set on receipt, not creation
    batch.initial_quantity,
    batch.notes                 ?? null,
    batch.status_id,
    null,                                 // released_at — set on release, not creation
    null,                                 // released_by — set on release, not creation
    null,                                 // released_by_manufacturer_id
    batch.created_by            ?? null,
    null,                                 // updated_at — null at insert time
    null,                                 // updated_by — null at insert time
  ]);
  
  validateBulkInsertRows(rows, PB_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'product_batches',
      PB_INSERT_COLUMNS,
      rows,
      PB_CONFLICT_COLUMNS,
      PB_UPDATE_STRATEGIES,
      client,
      { meta: { context } },
      '*'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert product batch records.',
      meta:    { batchCount: productBatches.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'product_batches',
        rows,
        rows.length,
        { context, conflictColumns: PB_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single product batch by ID.
 *
 * Returns null if no batch exists for the given ID.
 *
 * @param {string}                  batchId - UUID of the batch.
 * @param {PoolClient} client  - DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Batch row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getProductBatchById = async (batchId, client) => {
  const context = 'product-batch-repository/getProductBatchById';
  
  try {
    const { rows } = await query(PB_GET_BY_ID_QUERY, [batchId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch product batch.',
      meta:    { batchId },
      logFn:   (err) => logDbQueryError(
        PB_GET_BY_ID_QUERY, [batchId], err, { context, batchId }
      ),
    });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Performs a partial update on a product batch record.
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
const updateProductBatch = async (params, client) => {
  const {
    batchId,
    lot_number,
    manufacturer_id,
    manufacture_date,
    expiry_date,
    received_at,
    received_by,
    initial_quantity,
    notes,
    status_id,
    released_by,
    released_by_manufacturer_id,
    updatedBy,
  } = params;
  
  const updates = {
    lot_number,
    manufacturer_id,
    manufacture_date,
    expiry_date,
    received_at,
    received_by,
    initial_quantity,
    notes,
    status_id,
    released_by,
    released_by_manufacturer_id,
  };
  
  return await updateById(
    'product_batches',
    batchId,
    updates,
    updatedBy,
    client
  );
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full product batch detail by ID.
 *
 * Includes SKU, product, manufacturer, status, and user fields.
 * Returns null if no batch exists for the given ID.
 *
 * @param {string} batchId - UUID of the batch.
 *
 * @returns {Promise<Object|null>} Full batch detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getProductBatchDetailsById = async (batchId) => {
  const context = 'product-batch-repository/getProductBatchDetailsById';
  
  try {
    const { rows } = await query(PB_GET_DETAILS_BY_ID_QUERY, [batchId]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch product batch detail.',
      meta:    { batchId },
      logFn:   (err) => logDbQueryError(
        PB_GET_DETAILS_BY_ID_QUERY, [batchId], err, { context, batchId }
      ),
    });
  }
};

module.exports = {
  getPaginatedProductBatches,
  insertProductBatchesBulk,
  getProductBatchById,
  updateProductBatch,
  getProductBatchDetailsById,
};
