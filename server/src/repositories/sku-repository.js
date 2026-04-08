/**
 * @file sku-repository.js
 * @description Database access layer for SKU records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from sku-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getLastSku                — fetch most recent SKU for a brand/category pattern
 *  - getPaginatedSkuProductCards — paginated product card list with filtering and sorting
 *  - getSkuLookup              — offset-paginated SKU dropdown list
 *  - getPaginatedSkus          — paginated SKU list with filtering and sorting
 *  - checkBarcodeExists        — existence check for a barcode value
 *  - checkSkuExists            — existence check for a sku + product_id pair
 *  - insertSkusBulk            — bulk upsert of SKU records
 *  - getSkuDetailsById         — full SKU metadata fetch by id
 *  - skuHasAnyHistory          — existence check across orders, batches, and inventory
 *  - updateSkuMetadata         — patch allowed metadata fields
 *  - updateSkuStatus           — patch status_id and status_date
 *  - updateSkuDimensions       — patch dimension fields
 *  - updateSkuIdentity         — patch sku code and barcode
 */

'use strict';

const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { query } = require('../database/db');
const {
  paginateQueryByOffset,
  paginateQuery,
} = require('../utils/db/pagination/pagination-helpers');
const { bulkInsert, updateById } = require('../utils/db/write-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const AppError = require('../utils/AppError');
const {
  buildWhereClauseAndParams,
  skuDropdownKeywordHandler,
  buildSkuFilter,
  buildSkuProductCardFilters,
} = require('../utils/sql/build-sku-filter');
const { existsQuery } = require('./utils/repository-helper');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  GET_LAST_SKU_QUERY,
  CHECK_BARCODE_EXISTS_QUERY,
  CHECK_SKU_EXISTS_QUERY,
  SKU_DETAILS_QUERY,
  SKU_HAS_ANY_HISTORY_QUERY,
  TABLE_NAME,
  PRIVILEGED_JOINS,
  BASE_JOINS,
  PRIVILEGED_SELECT_FIELDS,
  BASE_SELECT_FIELDS,
  SKU_PRODUCT_CARD_JOINS,
  SKU_PRODUCT_CARD_SORT_WHITELIST,
  buildSkuProductCardQuery,
  SKU_LIST_JOINS,
  SKU_LIST_SORT_WHITELIST,
  SKU_LIST_ADDITIONAL_SORTS,
  buildPaginatedSkusQuery,
} = require('./queries/sku-queries');

// ─── Last SKU ─────────────────────────────────────────────────────────────────

/**
 * Fetches the most recent SKU code matching a brand/category prefix pattern.
 *
 * Returns null if no matching SKU exists.
 *
 * @param {string} brandCode    - Brand portion of the SKU prefix (e.g. 'CH').
 * @param {string} categoryCode - Category portion of the SKU prefix (e.g. 'HN').
 *
 * @returns {Promise<string|null>} Most recent matching SKU code, or null.
 * @throws  {AppError}            Normalized database error if the query fails.
 */
const getLastSku = async (brandCode, categoryCode) => {
  const context = 'sku-repository/getLastSku';
  const pattern = `${brandCode}-${categoryCode}%`;
  const params  = [pattern];
  
  try {
    const result = await query(GET_LAST_SKU_QUERY, params);
    return result.rows[0]?.sku ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch last SKU.',
      meta:    { brandCode, categoryCode },
      logFn:   (err) => logDbQueryError(
        GET_LAST_SKU_QUERY,
        params,
        err,
        { context, brandCode, categoryCode }
      ),
    });
  }
};

// ─── SKU Product Cards ────────────────────────────────────────────────────────

/**
 * Fetches paginated SKU product card records with optional filtering and sorting.
 *
 * Joins products, compliance, MSRP pricing, status, and primary thumbnail image.
 * Results are grouped to collapse compliance and image lateral joins.
 *
 * @param {Object}       options
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='createdAt']   - Sort key (mapped via skuProductCards).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 * @param {Object}       [options.filters={}]           - Field filters.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedSkuProductCards = async ({
                                             page      = 1,
                                             limit     = 10,
                                             sortBy    = 'createdAt',
                                             sortOrder = 'DESC',
                                             filters   = {},
                                           }) => {
  const context = 'sku-repository/getPaginatedSkuProductCards';
  
  const { whereClause, params } = buildSkuProductCardFilters(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'skuProductCards',
    defaultSort: SORTABLE_FIELDS.skuProductCards.defaultNaturalSort,
  });
  
  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildSkuProductCardQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    'skus s',
      joins:        SKU_PRODUCT_CARD_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      additionalSorts: ['s.created_at'],
      whitelistSet: SKU_PRODUCT_CARD_SORT_WHITELIST,
      meta:         { context },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU product cards.',
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

// ─── SKU Lookup (Dropdown) ────────────────────────────────────────────────────

/**
 * Fetches offset-paginated SKU records for dropdown/lookup use.
 *
 * Supports privileged mode (allowAllSkus) which bypasses active status filtering
 * and uses a broader join set.
 *
 * @param {Object}  params
 * @param {string}  productStatusId          - Active status UUID; required when allowAllSkus is false.
 * @param {Object}  [filters={}]             - Field filters.
 * @param {Object}  [options={}]             - Query behaviour options.
 * @param {boolean} [options.allowAllSkus]   - If true, bypasses status enforcement.
 * @param {number}  [limit=50]               - Records per page.
 * @param {number}  [offset=0]               - Record offset.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database or validation error.
 */
const getSkuLookup = async ({
                              productStatusId,
                              filters = {},
                              options = {},
                              limit   = 50,
                              offset  = 0,
                            }) => {
  const context = 'sku-repository/getSkuLookup';
  
  const { whereClause, params } = buildWhereClauseAndParams(
    productStatusId,
    filters,
    skuDropdownKeywordHandler,
    options
  );
  
  // Static parts resolved from module-level constants — no allocation per call.
  const joins        = options.allowAllSkus ? PRIVILEGED_JOINS         : BASE_JOINS;
  const selectFields = options.allowAllSkus ? PRIVILEGED_SELECT_FIELDS : BASE_SELECT_FIELDS;
  
  // queryText must be built per request because whereClause is dynamic.
  const queryText = `
    SELECT
      ${selectFields.join(',\n      ')}
    FROM ${TABLE_NAME}
    ${joins.join('\n    ')}
    WHERE ${whereClause}
    GROUP BY s.id
  `;
  
  try {
    return await paginateQueryByOffset({
      tableName:      TABLE_NAME,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      additionalSorts: [],
      rawOrderBy: `
        MIN(p.brand) ASC,
        LPAD(REGEXP_REPLACE(MIN(p.name), '[^0-9]', '', 'g'), 10, '0') NULLS LAST,
        MIN(p.name) ASC,
        s.id
      `,
      whitelistSet:   null,
      // useDistinct scopes COUNT(*) to unique s.id values so totalRecords stays
      // accurate even before GROUP BY collapses rows.
      useDistinct:    !!options.allowAllSkus,
      distinctColumn: options.allowAllSkus ? 's.id' : undefined,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU options for dropdown.',
      meta:    { offset, limit, filters, options },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, offset, limit }
      ),
    });
  }
};

// ─── Paginated SKU List ───────────────────────────────────────────────────────

/**
 * Fetches paginated SKU records with optional filtering and sorting.
 *
 * Joins products, status, audit users, and primary thumbnail image.
 * Applies deterministic tie-breaking via SKU_LIST_ADDITIONAL_SORTS.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='createdAt']   - Sort key (mapped via skuSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedSkus = async ({
                                  filters   = {},
                                  page      = 1,
                                  limit     = 10,
                                  sortBy    = 'createdAt',
                                  sortOrder = 'DESC',
                                }) => {
  const context = 'sku-repository/getPaginatedSkus';
  
  const { whereClause, params } = buildSkuFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'skuSortMap',
    defaultSort: SORTABLE_FIELDS.skuSortMap.defaultNaturalSort,
  });
  
  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildPaginatedSkusQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:       'skus s',
      joins:           SKU_LIST_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:          sortConfig.sortBy,
      sortOrder:       sortConfig.sortOrder,
      additionalSorts: SKU_LIST_ADDITIONAL_SORTS,
      whitelistSet:    SKU_LIST_SORT_WHITELIST,
      meta:            { context },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated SKU records.',
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

// ─── Barcode Existence Check ──────────────────────────────────────────────────

/**
 * Returns true if a SKU with the given barcode already exists.
 *
 * Skips the query and returns false immediately when barcode is falsy.
 *
 * @param {string|null}                barcode - Barcode value to check.
 * @param {PoolClient}    [client] - Optional transaction client.
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const checkBarcodeExists = async (barcode, client) => {
  if (!barcode) return false;
  
  const context = 'sku-repository/checkBarcodeExists';
  const params  = [barcode];
  
  try {
    const { rows } = await query(CHECK_BARCODE_EXISTS_QUERY, params, client);
    return rows.length > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check barcode existence.',
      meta:    { barcode },
      logFn:   (err) => logDbQueryError(
        CHECK_BARCODE_EXISTS_QUERY,
        params,
        err,
        { context, barcode }
      ),
    });
  }
};

// ─── SKU Existence Check ──────────────────────────────────────────────────────

/**
 * Returns true if a SKU with the given code already exists for the product.
 *
 * @param {string}                  sku       - SKU code to check.
 * @param {string}                  productId - Product UUID.
 * @param {PoolClient} [client]  - Optional transaction client.
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const checkSkuExists = async (sku, productId, client) => {
  const context = 'sku-repository/checkSkuExists';
  const params  = [sku, productId];
  
  try {
    const { rows } = await query(CHECK_SKU_EXISTS_QUERY, params, client);
    return rows.length > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check SKU existence.',
      meta:    { sku, productId },
      logFn:   (err) => logDbQueryError(
        CHECK_SKU_EXISTS_QUERY,
        params,
        err,
        { context, sku, productId }
      ),
    });
  }
};

// ─── Bulk Insert ──────────────────────────────────────────────────────────────

/**
 * Bulk upserts SKU records, returning the inserted/updated row ids.
 *
 * Conflicts on (product_id, sku) update description and updated_at.
 * Returns an empty array immediately when skus is empty.
 *
 * @param {Array<Object>}           skus     - SKU payloads to insert.
 * @param {PoolClient} [client] - Optional transaction client.
 *
 * @returns {Promise<Array<{id: string}>>} Inserted/updated row ids.
 * @throws  {AppError} Normalized database error if the insert fails.
 */
const insertSkusBulk = async (skus, client) => {
  if (!Array.isArray(skus) || skus.length === 0) return [];
  
  const context = 'sku-repository/insertSkusBulk';
  
  const columns = [
    'product_id',
    'sku',
    'barcode',
    'language',
    'country_code',
    'market_region',
    'size_label',
    'description',
    'length_cm',
    'width_cm',
    'height_cm',
    'weight_g',
    'status_id',
    'created_by',
    'updated_at',
    'updated_by',
  ];
  
  const rows = skus.map((s) => [
    s.product_id,
    s.sku,
    s.barcode,
    s.language,
    s.country_code,
    s.market_region,
    s.size_label,
    s.description,
    s.length_cm  ?? null,
    s.width_cm   ?? null,
    s.height_cm  ?? null,
    s.weight_g   ?? null,
    s.status_id,
    s.created_by ?? null,
    null,
    null,
  ]);
  
  validateBulkInsertRows(rows, columns.length);
  
  const conflictColumns   = ['product_id', 'sku'];
  const updateStrategies  = {
    description: 'overwrite',
    updated_at:  'overwrite',
  };
  
  try {
    return await bulkInsert(
      'skus',
      columns,
      rows,
      conflictColumns,
      updateStrategies,
      client,
      { meta: { context } },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert SKU records.',
      meta:    { skuCount: skus.length },
      logFn: (err) => logBulkInsertError(err, 'skus', null, rows.length, { context }),
    });
  }
};

// ─── SKU Detail ───────────────────────────────────────────────────────────────

/**
 * Fetches full SKU metadata for a single SKU by id.
 *
 * Returns null if no matching SKU exists.
 *
 * @param {string} skuId - UUID of the SKU to fetch.
 *
 * @returns {Promise<Object|null>} SKU detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getSkuDetailsById = async (skuId) => {
  const context = 'sku-repository/getSkuDetailsById';
  const params  = [skuId];
  
  try {
    const { rows } = await query(SKU_DETAILS_QUERY, params);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU detail.',
      meta:    { skuId },
      logFn:   (err) => logDbQueryError(
        SKU_DETAILS_QUERY,
        params,
        err,
        { context, skuId }
      ),
    });
  }
};

// ─── SKU History Check ────────────────────────────────────────────────────────

/**
 * Returns true if the SKU has any associated orders, product batches,
 * or warehouse inventory entries.
 *
 * @param {string}                  skuId    - UUID of the SKU to check.
 * @param {PoolClient} [client] - Optional transaction client.
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const skuHasAnyHistory = async (skuId, client = null) => {
  const context = 'sku-repository/skuHasAnyHistory';
  
  return existsQuery(
    SKU_HAS_ANY_HISTORY_QUERY,
    [skuId],
    context,
    'Failed to check SKU historical references',
    client
  );
};

// ─── SKU Updates ─────────────────────────────────────────────────────────────

/**
 * Patches allowed metadata fields on a SKU record.
 *
 * Allowed fields: description, size_label, language, market_region.
 *
 * @param {string}                  skuId   - UUID of the SKU to update.
 * @param {Object}                  payload - Fields to update.
 * @param {string}                  userId  - UUID of the acting user.
 * @param {PoolClient} client  - Transaction client.
 *
 * @returns {Promise<{id: string}>}
 * @throws  {AppError} Validation error if no valid fields are provided.
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateSkuMetadata = async (skuId, payload, userId, client) => {
  const context = 'sku-repository/updateSkuMetadata';
  
  const allowedFields = ['description', 'size_label', 'language', 'market_region'];
  const updates = {};
  
  for (const key of allowedFields) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }
  
  if (Object.keys(updates).length === 0) {
    throw AppError.validationError('No valid metadata fields provided.', { context });
  }
  
  try {
    return await updateById('skus', skuId, updates, userId, client);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update SKU metadata.',
      meta:    { skuId, updatedBy: userId, fieldsUpdated: Object.keys(updates) },
    });
  }
};

/**
 * Patches the status_id and status_date on a SKU record.
 *
 * @param {string}                  skuId    - UUID of the SKU to update.
 * @param {string}                  statusId - UUID of the new status.
 * @param {string}                  userId   - UUID of the acting user.
 * @param {PoolClient} client   - Transaction client.
 *
 * @returns {Promise<{id: string}>}
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateSkuStatus = async (skuId, statusId, userId, client) => {
  const context = 'sku-repository/updateSkuStatus';
  
  const updates = {
    status_id:   statusId,
    status_date: new Date(),
  };
  
  try {
    return await updateById('skus', skuId, updates, userId, client);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update SKU status.',
      meta:    { skuId, statusId, updatedBy: userId },
    });
  }
};

/**
 * Patches dimension fields on a SKU record.
 *
 * Allowed fields: length_cm, width_cm, height_cm, weight_g.
 *
 * @param {string}                  skuId   - UUID of the SKU to update.
 * @param {Object}                  payload - Fields to update.
 * @param {string}                  userId  - UUID of the acting user.
 * @param {PoolClient} client  - Transaction client.
 *
 * @returns {Promise<{id: string}>}
 * @throws  {AppError} Validation error if no valid fields are provided.
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateSkuDimensions = async (skuId, payload, userId, client) => {
  const context = 'sku-repository/updateSkuDimensions';
  
  const allowedFields = ['length_cm', 'width_cm', 'height_cm', 'weight_g'];
  const updates = {};
  
  for (const key of allowedFields) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }
  
  if (Object.keys(updates).length === 0) {
    throw AppError.validationError('No dimension fields provided.', { context });
  }
  
  try {
    return await updateById('skus', skuId, updates, userId, client);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update SKU dimensions.',
      meta:    { skuId, updatedBy: userId, fieldsUpdated: Object.keys(updates) },
    });
  }
};

/**
 * Patches identity fields (sku code and barcode) on a SKU record.
 *
 * Allowed fields: sku, barcode.
 *
 * @param {string}                  skuId   - UUID of the SKU to update.
 * @param {Object}                  payload - Fields to update.
 * @param {string}                  userId  - UUID of the acting user.
 * @param {PoolClient} client  - Transaction client.
 *
 * @returns {Promise<{id: string}>}
 * @throws  {AppError} Validation error if no valid fields are provided.
 * @throws  {AppError} Normalized database error if the update fails.
 */
const updateSkuIdentity = async (skuId, payload, userId, client) => {
  const context = 'sku-repository/updateSkuIdentity';
  
  const allowedFields = ['sku', 'barcode'];
  const updates = {};
  
  for (const key of allowedFields) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }
  
  if (Object.keys(updates).length === 0) {
    throw AppError.validationError('No identity fields provided.', { context });
  }
  
  try {
    return await updateById('skus', skuId, updates, userId, client);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update SKU identity.',
      meta:    { skuId, updatedBy: userId, fieldsUpdated: Object.keys(updates) },
    });
  }
};

module.exports = {
  getLastSku,
  getPaginatedSkuProductCards,
  getSkuLookup,
  getPaginatedSkus,
  checkBarcodeExists,
  checkSkuExists,
  insertSkusBulk,
  getSkuDetailsById,
  skuHasAnyHistory,
  updateSkuMetadata,
  updateSkuStatus,
  updateSkuDimensions,
  updateSkuIdentity,
};
