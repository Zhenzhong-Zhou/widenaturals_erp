/**
 * @file warehouse-repository.js
 * @description Database access layer for warehouse records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from warehouse-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedWarehouses — paginated warehouse list with filtering and sorting
 *  - getWarehouseById       — full warehouse detail fetch by id
 *  - getWarehouseLookup     — fetch all warehouses matching optional filters
 */

'use strict';

const { query } = require('../database/db');
const { paginateQuery } = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildWarehouseFilter } = require('../utils/sql/build-warehouse-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  TABLE_NAME,
  JOINS,
  SELECT_FIELDS,
  WAREHOUSE_SORT_WHITELIST,
  WAREHOUSE_ADDITIONAL_SORTS,
  buildWarehousePaginatedQuery,
  GET_WAREHOUSE_BY_ID_QUERY,
} = require('./queries/warehouse-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated warehouse records with optional filtering and sorting.
 *
 * Joins locations, warehouse types, status, and audit users.
 * Applies deterministic tie-breaking via WAREHOUSE_ADDITIONAL_SORTS.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='createdAt']   - Sort key (mapped via warehouseSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedWarehouses = async ({
                                        filters   = {},
                                        page      = 1,
                                        limit     = 10,
                                        sortBy    = 'createdAt',
                                        sortOrder = 'DESC',
                                      }) => {
  const context = 'warehouse-repository/getPaginatedWarehouses';
  
  const { whereClause, params } = buildWarehouseFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'warehouseSortMap',
    defaultSort: SORTABLE_FIELDS.warehouseSortMap.defaultNaturalSort,
  });
  
  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildWarehousePaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:       TABLE_NAME,
      joins:           JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:          sortConfig.sortBy,
      sortOrder:       sortConfig.sortOrder,
      additionalSorts: WAREHOUSE_ADDITIONAL_SORTS,
      whitelistSet:    WAREHOUSE_SORT_WHITELIST,
      meta:            { context },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated warehouses.',
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

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full warehouse detail by id.
 *
 * Returns null if no matching warehouse exists.
 *
 * @param {string} warehouseId - UUID of the warehouse to fetch.
 *
 * @returns {Promise<Object|null>} Warehouse detail row, or null if not found.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getWarehouseById = async (warehouseId) => {
  const context = 'warehouse-repository/getWarehouseById';
  const params  = [warehouseId];
  
  try {
    const { rows } = await query(GET_WAREHOUSE_BY_ID_QUERY, params);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse detail.',
      meta:    { warehouseId },
      logFn:   (err) => logDbQueryError(
        GET_WAREHOUSE_BY_ID_QUERY,
        params,
        err,
        { context, warehouseId }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches all warehouse records matching optional filters, ordered by name.
 *
 * Not paginated — warehouses are a small bounded set used for dropdowns
 * and selection lists.
 *
 * @param {Object} [options]
 * @param {Object} [options.filters={}] - Field filters.
 *
 * @returns {Promise<Array<Object>>} Warehouse rows ordered by name.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getWarehouseLookup = async ({ filters = {} } = {}) => {
  const context = 'warehouse-repository/getWarehouseLookup';
  
  const { whereClause, params } = buildWarehouseFilter(filters);
  
  // queryText built per request because whereClause is dynamic.
  // ORDER BY is safe here — raw query(), not paginateQuery().
  const queryText = `
    SELECT
      ${SELECT_FIELDS.join(',\n      ')}
    FROM ${TABLE_NAME}
    ${JOINS.join('\n    ')}
    WHERE ${whereClause}
    ORDER BY w.name ASC
  `;
  
  try {
    const { rows } = await query(queryText, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse lookup options.',
      meta:    { filters },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters }
      ),
    });
  }
};

module.exports = {
  getPaginatedWarehouses,
  getWarehouseById,
  getWarehouseLookup,
};
