/**
 * @file status-repository.js
 * @description Database access layer for status records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from status-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedStatuses — paginated status list with filtering and sorting
 *  - checkStatusExists    — existence check by id
 *  - getAllStatuses        — full unfiltered status list ordered by name
 *  - getStatusLookup      — offset-paginated status dropdown list
 */

'use strict';

const { query } = require('../database/db');
const {
  paginateQueryByOffset,
  paginateQuery,
} = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildStatusFilter } = require('../utils/sql/build-status-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  STATUS_TABLE,
  STATUS_SORT_WHITELIST,
  STATUS_LOOKUP_SORT_WHITELIST,
  STATUS_LOOKUP_ADDITIONAL_SORTS,
  CHECK_STATUS_EXISTS_QUERY,
  GET_ALL_STATUSES_QUERY,
  buildStatusPaginatedQuery,
  buildStatusLookupQuery,
} = require('./queries/status-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated status records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='name']        - Sort key (mapped via statusSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']      - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedStatuses = async ({
                                      filters   = {},
                                      page      = 1,
                                      limit     = 10,
                                      sortBy    = 'name',
                                      sortOrder = 'ASC',
                                    }) => {
  const context = 'status-repository/getPaginatedStatuses';
  
  const { whereClause, params } = buildStatusFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'statusSortMap',
    defaultSort: SORTABLE_FIELDS.statusSortMap.defaultNaturalSort,
  });
  
  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildStatusPaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    STATUS_TABLE,
      joins:        [],
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: STATUS_SORT_WHITELIST,
      meta:         { context },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated statuses.',
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

// ─── Existence Check ──────────────────────────────────────────────────────────

/**
 * Returns true if a status record with the given id exists.
 *
 * @param {string}                  statusId - UUID of the status to check.
 * @param {PoolClient} [client] - Optional transaction client.
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const checkStatusExists = async (statusId, client) => {
  const context = 'status-repository/checkStatusExists';
  const params  = [statusId];
  
  try {
    const { rows } = await query(CHECK_STATUS_EXISTS_QUERY, params, client);
    return rows[0]?.exists ?? false;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to execute status existence check.',
      meta:    { statusId },
      logFn:   (err) => logDbQueryError(
        CHECK_STATUS_EXISTS_QUERY,
        params,
        err,
        { context, statusId }
      ),
    });
  }
};

// ─── Full List ────────────────────────────────────────────────────────────────

/**
 * Fetches all status records ordered by name.
 *
 * Intended for seeding select lists where pagination is not needed.
 *
 * @param {PoolClient} [client] - Optional transaction client.
 *
 * @returns {Promise<Array<Object>>} All status rows.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getAllStatuses = async (client) => {
  const context = 'status-repository/getAllStatuses';
  
  try {
    const { rows } = await query(GET_ALL_STATUSES_QUERY, [], client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to load all statuses.',
      meta:    {},
      logFn:   (err) => logDbQueryError(
        GET_ALL_STATUSES_QUERY,
        [],
        err,
        { context }
      ),
    });
  }
};

// ─── Lookup (Dropdown) ────────────────────────────────────────────────────────

/**
 * Fetches offset-paginated status records for dropdown/lookup use.
 *
 * Shares buildStatusFilter with getPaginatedStatuses — the schema is a flat
 * table with no joins so one filter builder covers both call sites.
 *
 * @param {Object}  options
 * @param {Object}  [options.filters={}] - Field filters.
 * @param {number}  [options.limit=50]   - Records per page.
 * @param {number}  [options.offset=0]   - Record offset.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getStatusLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'status-repository/getStatusLookup';
  
  const { whereClause, params } = buildStatusFilter(filters);
  
  const queryText = buildStatusLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       STATUS_TABLE,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          's.name',
      sortOrder:       'ASC',
      additionalSorts: STATUS_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    STATUS_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch status lookup.',
      meta:    { filters, offset, limit },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, offset, limit }
      ),
    });
  }
};

module.exports = {
  getPaginatedStatuses,
  checkStatusExists,
  getAllStatuses,
  getStatusLookup,
};
