/**
 * @file order-type-repository.js
 * @description Database access layer for order type records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from order-type-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedOrderTypes        — paginated list with filtering and sorting
 *  - getOrderTypeLookup            — offset-paginated dropdown lookup
 *  - getOrderTypeIdsByCategory     — fetch order type UUIDs by category
 *  - getOrderTypeMetaByOrderId     — fetch order type metadata by order id
 */

'use strict';

const {
  paginateQuery,
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { getFieldValuesByField } = require('../utils/db/record-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  buildOrderTypeFilter,
} = require('../utils/sql/build-order-type-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  ORDER_TYPE_TABLE,
  ORDER_TYPE_JOINS,
  ORDER_TYPE_PAGINATED_SORT_WHITELIST,
  buildOrderTypePaginatedQuery,
  ORDER_TYPE_LOOKUP_TABLE,
  ORDER_TYPE_LOOKUP_SORT_WHITELIST,
  buildOrderTypeLookupQuery,
  ORDER_TYPE_META_BY_ORDER_QUERY,
} = require('./queries/order-type-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated order type records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]          - Field filters.
 * @param {number}       [options.page=1]              - Page number (1-based).
 * @param {number}       [options.limit=10]            - Records per page.
 * @param {string}       [options.sortBy='ot.name']    - Whitelisted DB column.
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedOrderTypes = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'ot.name',
  sortOrder = 'ASC',
}) => {
  const context = 'order-type-repository/getPaginatedOrderTypes';

  const { whereClause, params } = buildOrderTypeFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'orderTypeSortMap',
    defaultSort: SORTABLE_FIELDS.orderTypeSortMap.defaultNaturalSort,
  });

  const queryText = buildOrderTypePaginatedQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: ORDER_TYPE_TABLE,
      joins: ORDER_TYPE_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: ORDER_TYPE_PAGINATED_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated order types.',
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

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated order type records for dropdown/lookup use.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters.
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getOrderTypeLookup = async ({
  filters = {},
  limit = 50,
  offset = 0,
} = {}) => {
  const context = 'order-type-repository/getOrderTypeLookup';

  const { whereClause, params } = buildOrderTypeFilter(filters);
  const queryText = buildOrderTypeLookupQuery(whereClause);

  try {
    return await paginateQueryByOffset({
      tableName: ORDER_TYPE_LOOKUP_TABLE,
      joins: [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'ot.name',
      sortOrder: 'ASC',
      whitelistSet: ORDER_TYPE_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order type lookup.',
      meta: { filters, limit, offset },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          limit,
          offset,
        }),
    });
  }
};

// ─── By Category ─────────────────────────────────────────────────────────────

/**
 * Fetches order type UUIDs filtered by category.
 *
 * Delegates entirely to `getFieldValuesByField` which handles execution
 * and error normalization internally.
 *
 * @param {string}          category      - Order type category to filter by.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<string[]>} Array of order type UUIDs matching the category.
 * @throws  {AppError}          If the query fails.
 */
const getOrderTypeIdsByCategory = async (category, client = null) => {
  return await getFieldValuesByField(
    'order_types',
    'category',
    category,
    'id',
    client
  );
};

// ─── Meta By Order ────────────────────────────────────────────────────────────

/**
 * Fetches order type metadata for a given order.
 *
 * Returns null if no order exists for the given ID.
 *
 * @param {string}          orderId       - UUID of the order.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Order type metadata row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getOrderTypeMetaByOrderId = async (orderId, client = null) => {
  const context = 'order-type-repository/getOrderTypeMetaByOrderId';

  try {
    const { rows } = await query(
      ORDER_TYPE_META_BY_ORDER_QUERY,
      [orderId],
      client
    );
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch order type metadata.',
      meta: { orderId },
      logFn: (err) =>
        logDbQueryError(ORDER_TYPE_META_BY_ORDER_QUERY, [orderId], err, {
          context,
          orderId,
        }),
    });
  }
};

module.exports = {
  getPaginatedOrderTypes,
  getOrderTypeLookup,
  getOrderTypeIdsByCategory,
  getOrderTypeMetaByOrderId,
};
