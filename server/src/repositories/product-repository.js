/**
 * @file product-repository.js
 * @description Database access layer for product records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from product-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - checkProductExists      — parameterised existence check with validated field names
 *  - getPaginatedProducts    — paginated list with filtering and sorting
 *  - getProductDetailsById   — full detail fetch by product id
 *  - updateProductStatus     — update product status via updateById
 *  - updateProductInfo       — partial update via updateById
 *  - insertProductsBulk      — bulk upsert with conflict resolution
 *  - getProductLookup        — offset-paginated dropdown lookup
 */

'use strict';

const { query } = require('../database/db');
const { bulkInsert, updateById } = require('../utils/db/write-utils');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { paginateQueryByOffset, paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { buildProductFilter } = require('../utils/sql/build-product-filter');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const { resolveSort } = require('../utils/query/sort-resolver');
const { validateIdentifier } = require('../utils/sql-ident');
const {
  PRODUCT_INSERT_COLUMNS,
  PRODUCT_CONFLICT_COLUMNS,
  PRODUCT_UPDATE_STRATEGIES,
  PRODUCT_TABLE,
  PRODUCT_JOINS,
  PRODUCT_SORT_WHITELIST,
  buildProductPaginatedQuery,
  PRODUCT_DETAILS_QUERY,
  PRODUCT_LOOKUP_TABLE,
  PRODUCT_LOOKUP_JOINS,
  PRODUCT_LOOKUP_SORT_WHITELIST,
  PRODUCT_LOOKUP_ADDITIONAL_SORTS,
  buildProductLookupQuery,
} = require('./queries/product-queries');

// Allowed field names for checkProductExists — validated before SQL interpolation.
const _PRODUCT_EXISTS_ALLOWED_FIELDS = new Set(['id', 'barcode', 'product_name']);

// ─── Existence Check ──────────────────────────────────────────────────────────

/**
 * Checks whether a product exists matching the given field filters.
 *
 * Field names are validated against an allowlist before interpolation —
 * only 'id', 'barcode', and 'product_name' are permitted.
 *
 * @param {Object}  filters             - Field/value pairs to match.
 * @param {string}  [combineWith='OR']  - 'OR' or 'AND' — how conditions are combined.
 *
 * @returns {Promise<boolean>} True if at least one matching product exists.
 * @throws  {AppError}         Validation error if no valid filters are provided.
 * @throws  {AppError}         Normalized database error if the query fails.
 */
const checkProductExists = async (filters, combineWith = 'OR') => {
  const context = 'product-repository/checkProductExists';
  
  if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
    throw AppError.validationError(
      'No valid filters provided for product existence check.',
      { context, meta: { providedFilters: filters } }
    );
  }
  
  const whereClauses = [];
  const queryParams  = [];
  
  for (const [key, value] of Object.entries(filters)) {
    if (!_PRODUCT_EXISTS_ALLOWED_FIELDS.has(key) || !value) continue;
    // validateIdentifier guards against SQL injection on the field name.
    const safeKey = validateIdentifier(key);
    whereClauses.push(`${safeKey} = $${queryParams.length + 1}`);
    queryParams.push(value);
  }
  
  if (whereClauses.length === 0) {
    throw AppError.validationError(
      'No valid filters provided for product existence check.',
      { context, meta: { providedFilters: filters } }
    );
  }
  
  const operator  = combineWith.toUpperCase() === 'AND' ? ' AND ' : ' OR ';
  const queryText = `
    SELECT EXISTS (
      SELECT 1
      FROM products
      WHERE ${whereClauses.join(operator)}
    ) AS exists
  `;
  
  try {
    const { rows } = await query(queryText, queryParams);
    return rows[0].exists;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to execute product existence check.',
      meta:    { filters },
      logFn:   (err) => logDbQueryError(
        queryText, queryParams, err, { context }
      ),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated product records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]          - Field filters.
 * @param {number}       [options.page=1]              - Page number (1-based).
 * @param {number}       [options.limit=10]            - Records per page.
 * @param {string}       [options.sortBy='createdAt']  - Sort key (mapped via productSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']    - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedProducts = async ({
                                      filters   = {},
                                      page      = 1,
                                      limit     = 10,
                                      sortBy    = 'createdAt',
                                      sortOrder = 'DESC',
                                    }) => {
  const context = 'product-repository/getPaginatedProducts';
  
  const { whereClause, params } = buildProductFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'productSortMap',
    defaultSort: SORTABLE_FIELDS.productSortMap.defaultNaturalSort,
  });
  
  const queryText = buildProductPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    PRODUCT_TABLE,
      joins:        PRODUCT_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: PRODUCT_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated product records.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, page, limit }
      ),
    });
  }
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full product detail by ID.
 *
 * Returns null if no product exists for the given ID.
 *
 * @param {string} productId - UUID of the product.
 *
 * @returns {Promise<Object|null>} Product detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getProductDetailsById = async (productId) => {
  const context = 'product-repository/getProductDetailsById';
  
  try {
    const { rows } = await query(PRODUCT_DETAILS_QUERY, [productId]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch product detail.',
      meta:    { productId },
      logFn:   (err) => logDbQueryError(
        PRODUCT_DETAILS_QUERY, [productId], err, { context, productId }
      ),
    });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Updates a product's status and status_date.
 *
 * Delegates to `updateById` which handles metadata injection and error
 * normalization internally.
 *
 * @param {string}                  productId - UUID of the product.
 * @param {string}                  statusId  - UUID of the new status.
 * @param {string}                  userId    - UUID of the user performing the update.
 * @param {PoolClient} client    - DB client for transactional context.
 *
 * @returns {Promise<{ id: string }>} The updated product ID.
 * @throws  {AppError}                If the product does not exist or the update fails.
 */
const updateProductStatus = async (productId, statusId, userId, client) => {
  return await updateById(
    'products',
    productId,
    { status_id: statusId, status_date: new Date() },
    userId,
    client
  );
};

/**
 * Performs a partial update on a product record.
 *
 * Delegates to `updateById` which handles metadata injection and error
 * normalization internally.
 *
 * @param {string}                  productId - UUID of the product.
 * @param {Object}                  updates   - Fields to update.
 * @param {string}                  userId    - UUID of the user performing the update.
 * @param {PoolClient} client    - DB client for transactional context.
 *
 * @returns {Promise<{ id: string }>} The updated product ID.
 * @throws  {AppError}                Validation error if no update fields provided.
 * @throws  {AppError}                If the product does not exist or the update fails.
 */
const updateProductInfo = async (productId, updates, userId, client) => {
  if (!updates || Object.keys(updates).length === 0) {
    throw AppError.validationError(
      'No update fields provided for product update.'
    );
  }
  
  return await updateById('products', productId, updates, userId, client);
};

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts or updates product records.
 *
 * On conflict matching name + brand + category, overwrites description,
 * status, and audit fields.
 *
 * @param {Array<Object>}              products - Validated product objects to insert.
 * @param {PoolClient}    client   - DB client for transactional context.
 *
 * @returns {Promise<Array<{ id: string }>>} Inserted or updated product IDs.
 * @throws  {AppError}                        Validation error if products is empty or invalid.
 * @throws  {AppError}                        Normalized database error if the insert fails.
 */
const insertProductsBulk = async (products, client) => {
  if (!Array.isArray(products) || products.length === 0) return [];
  
  const context = 'product-repository/insertProductsBulk';
  
  // Validation is before IO — must not be inside the try block.
  if (!products.every((p) => p.name && p.brand && p.category)) {
    throw AppError.validationError(
      'Each product must include at least name, brand, and category.',
      { context }
    );
  }
  
  const rows = products.map((p) => [
    p.name,
    p.series      ?? null,
    p.brand,
    p.category,
    p.description ?? null,
    p.status_id,
    p.created_by  ?? null,
    null,                   // updated_by — null at insert time
    null,                   // updated_at — null at insert time
  ]);
  
  validateBulkInsertRows(rows, PRODUCT_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'products',
      PRODUCT_INSERT_COLUMNS,
      rows,
      PRODUCT_CONFLICT_COLUMNS,
      PRODUCT_UPDATE_STRATEGIES,
      client,
      { meta: { context } },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert product records.',
      meta:    { productCount: products.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'products',
        rows,
        rows.length,
        { context, conflictColumns: PRODUCT_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated product records for dropdown/lookup use.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters.
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getProductLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'product-repository/getProductLookup';
  
  const { whereClause, params } = buildProductFilter(filters);
  const queryText = buildProductLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       PRODUCT_LOOKUP_TABLE,
      joins:           PRODUCT_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'p.name',
      sortOrder:       'ASC',
      additionalSorts: PRODUCT_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    PRODUCT_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch product lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, limit, offset }
      ),
    });
  }
};

module.exports = {
  checkProductExists,
  getPaginatedProducts,
  getProductDetailsById,
  updateProductStatus,
  updateProductInfo,
  insertProductsBulk,
  getProductLookup,
};
