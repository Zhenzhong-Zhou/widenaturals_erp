/**
 * @file batch-registry-repository.js
 * @description Database access layer for batch registry records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from batch-registry-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getBatchRegistryById         — partial fetch (id, batch_type, note) by ID
 *  - getBatchRegistryLookup       — offset-paginated lookup with inventory scope filter
 *  - getPaginatedBatchRegistry    — page-paginated list with full joins and sorting
 *  - insertBatchRegistryBulk      — bulk insert with batch-type-aware conflict resolution
 *  - updateBatchRegistryNoteById  — updates note and audit fields by ID
 *  - getBatchRegistryDetailsById  — full detail fetch with batch and user joins
 */

'use strict';

const { query, bulkInsert } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { paginateQueryByOffset, paginateQuery } = require('../database/utils/pagination/pagination-helpers');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const {
  buildBatchRegistryInventoryScopeFilter,
  buildBatchRegistryFilter,
} = require('../utils/sql/build-batch-registry-filter');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const { resolveSort } = require('../utils/query/sort-resolver');
const {
  BATCH_REGISTRY_GET_BY_ID,
  BATCH_REGISTRY_LOOKUP_TABLE,
  BATCH_REGISTRY_LOOKUP_JOINS,
  BATCH_REGISTRY_LOOKUP_WHITELIST,
  BATCH_REGISTRY_PAGINATED_TABLE,
  BATCH_REGISTRY_PAGINATED_JOINS,
  BATCH_REGISTRY_SORT_WHITELIST,
  buildBatchRegistryPaginatedQuery,
  BATCH_REGISTRY_INSERT_COLUMNS,
  BATCH_REGISTRY_UPDATE_STRATEGIES,
  BATCH_REGISTRY_CONFLICT_COLUMNS_PRODUCT,
  BATCH_REGISTRY_CONFLICT_COLUMNS_PACKAGING,
  BATCH_REGISTRY_UPDATE_NOTE_QUERY,
  BATCH_REGISTRY_DETAILS_QUERY, buildBatchRegistryLookupQuery,
} = require('./queries/batch-registry-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a minimal batch registry record by ID.
 *
 * Returns only id, batch_type, and note — used for lightweight
 * existence checks and type resolution before deeper operations.
 *
 * @param {string}       batchRegistryId - UUID of the batch registry record.
 * @param {PoolClient}   client          - DB client for transactional context.
 *
 * @returns {Promise<{ id: string, batch_type: string, note: string|null }|null>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getBatchRegistryById = async (batchRegistryId, client) => {
  const context = 'batch-registry-repository/getBatchRegistryById';
  
  try {
    const { rows } = await query(BATCH_REGISTRY_GET_BY_ID, [batchRegistryId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch batch registry by ID.',
      meta:    { batchRegistryId },
      logFn:   (err) => logDbQueryError(
        BATCH_REGISTRY_GET_BY_ID,
        [batchRegistryId],
        err,
        { context, batchRegistryId }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated batch registry lookup scoped to inventory filters.
 *
 * Lightweight projection for dropdown/selection use — joins product, SKU,
 * and packaging batch data for display. Sorted by registration date descending.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Inventory scope filters.
 * @param {number} [options.limit=50]   - Max records per page.
 * @param {number} [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getBatchRegistryLookup = async ({ filters, limit = 50, offset = 0 }) => {
  const context = 'batch-registry-repository/getBatchRegistryLookup';
  
  const { whereClause, params } = buildBatchRegistryInventoryScopeFilter(filters);
  const queryText = buildBatchRegistryLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:    BATCH_REGISTRY_LOOKUP_TABLE,
      joins:        BATCH_REGISTRY_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:       'br.registered_at',
      sortOrder:    'DESC',
      whitelistSet: BATCH_REGISTRY_LOOKUP_WHITELIST,
      meta:         { filters },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch batch registry lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, limit, offset }
      ),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated batch registry records with full joins and sorting.
 *
 * Includes identity-level joins only — quantities, inventory placement,
 * QA records, and financial data are excluded by design and must be
 * fetched via domain-specific APIs.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]             - Field filters.
 * @param {number}       [options.page=1]                 - Page number (1-based).
 * @param {number}       [options.limit=20]               - Records per page.
 * @param {string}       [options.sortBy='registeredAt']  - Sort key (mapped via batchRegistrySortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']       - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedBatchRegistry = async ({
                                           filters   = {},
                                           page      = 1,
                                           limit     = 20,
                                           sortBy    = 'registeredAt',  // map key, not DB column
                                           sortOrder = 'DESC',
                                         }) => {
  const context = 'batch-registry-repository/getPaginatedBatchRegistry';
  
  const { whereClause, params } = buildBatchRegistryFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'batchRegistrySortMap',
    defaultSort: SORTABLE_FIELDS.batchRegistrySortMap.defaultNaturalSort,
  });
  
  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildBatchRegistryPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    BATCH_REGISTRY_PAGINATED_TABLE,
      joins:        BATCH_REGISTRY_PAGINATED_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: BATCH_REGISTRY_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated batch registry.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, page, limit }
      ),
    });
  }
};

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Bulk inserts batch registry records with batch-type-aware conflict resolution.
 *
 * All records in a single call must share the same batch_type.
 * Conflict target is determined by batch_type:
 *  - 'product'            → conflicts on product_batch_id
 *  - 'packaging_material' → conflicts on packaging_material_batch_id
 *
 * On conflict, only the note field is overwritten.
 *
 * @param {Array<Object>} registries - Validated registry objects to insert.
 * @param {PoolClient}    client     - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or upserted registry records.
 * @throws  {AppError}               Validation error if batch types are mixed.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertBatchRegistryBulk = async (registries, client) => {
  if (!Array.isArray(registries) || registries.length === 0) return [];
  
  const context = 'batch-registry-repository/insertBatchRegistryBulk';
  
  // All records must share the same batch_type — mixed types in a single
  // bulk insert would apply the wrong conflict column to some records.
  const batchType = registries[0].batch_type;
  
  if (!registries.every((r) => r.batch_type === batchType)) {
    throw AppError.validationError(
      'Batch registry bulk insert must contain a single batch_type.',
      { context }
    );
  }
  
  const rows = registries.map((r) => {
    // Required identifier validation — caught here before hitting the DB
    // to produce a clear validation error rather than a constraint violation.
    if (r.batch_type === 'product' && !r.product_batch_id) {
      throw AppError.validationError('Invalid batch registry request.', { context });
    }
    if (r.batch_type === 'packaging_material' && !r.packaging_material_batch_id) {
      throw AppError.validationError('Invalid batch registry request.', { context });
    }
    
    return [
      r.batch_type,
      r.product_batch_id              ?? null,
      r.packaging_material_batch_id   ?? null,
      r.registered_by                 ?? null,
      null,   // updated_at — null at insert time
      null,   // updated_by — null at insert time
      r.note                          ?? null,
    ];
  });
  
  // Conflict column is determined by batch_type — product and packaging
  // batches have separate unique constraints.
  const conflictColumns =
    batchType === 'product'
      ? BATCH_REGISTRY_CONFLICT_COLUMNS_PRODUCT
      : BATCH_REGISTRY_CONFLICT_COLUMNS_PACKAGING;
  
  validateBulkInsertRows(rows, BATCH_REGISTRY_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'batch_registry',
      BATCH_REGISTRY_INSERT_COLUMNS,
      rows,
      conflictColumns,
      BATCH_REGISTRY_UPDATE_STRATEGIES,
      client,
      { meta: { context } },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert batch registry records.',
      meta:    { registryCount: registries.length, batchType },
      logFn:   (err) => logBulkInsertError(
        err,
        'batch_registry',
        rows,
        rows.length,
        { context, conflictColumns }
      ),
    });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Updates the note and audit metadata of a batch registry record by ID.
 *
 * @param {Object}      options
 * @param {string}      options.id        - UUID of the registry record to update.
 * @param {string|null} options.note      - New note value (null clears the field).
 * @param {string|null} options.updatedBy - UUID of the user performing the update.
 * @param {PoolClient}  client            - DB client for transactional context.
 *
 * @returns {Promise<{ id: string }>} The updated record ID.
 * @throws  {AppError}                Not found error if the record does not exist.
 * @throws  {AppError}                Normalized database error if the update fails.
 */
const updateBatchRegistryNoteById = async ({ id, note, updatedBy }, client) => {
  const context = 'batch-registry-repository/updateBatchRegistryNoteById';
  
  let result;
  
  try {
    result = await query(
      BATCH_REGISTRY_UPDATE_NOTE_QUERY,
      [id, note ?? null, updatedBy ?? null],
      client
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update batch registry note.',
      meta:    { batchRegistryId: id },
      logFn:   (err) => logDbQueryError(
        BATCH_REGISTRY_UPDATE_NOTE_QUERY,
        [id, note ?? null, updatedBy ?? null],
        err,
        { context, batchRegistryId: id }
      ),
    });
  }
  
  // Not-found check is outside the try block — throwing AppError.notFoundError
  // inside the try would be caught and re-thrown as a databaseError.
  if (result.rowCount === 0) {
    throw AppError.notFoundError('Batch registry record not found.', { context });
  }
  
  return result.rows[0];
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full batch registry detail by ID including batch and user joins.
 *
 * Returns null if no record exists for the given ID.
 *
 * @param {string} registryId - UUID of the batch registry record.
 *
 * @returns {Promise<Object|null>} Full registry detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getBatchRegistryDetailsById = async (registryId) => {
  const context = 'batch-registry-repository/getBatchRegistryDetailsById';
  
  try {
    const { rows } = await query(BATCH_REGISTRY_DETAILS_QUERY, [registryId]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch batch registry detail.',
      meta:    { registryId },
      logFn:   (err) => logDbQueryError(
        BATCH_REGISTRY_DETAILS_QUERY,
        [registryId],
        err,
        { context, registryId }
      ),
    });
  }
};

module.exports = {
  getBatchRegistryById,
  getBatchRegistryLookup,
  getPaginatedBatchRegistry,
  insertBatchRegistryBulk,
  updateBatchRegistryNoteById,
  getBatchRegistryDetailsById,
};
