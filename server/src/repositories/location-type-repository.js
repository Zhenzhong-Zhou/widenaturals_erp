/**
 * @file location-type-repository.js
 * @description Database access layer for location type records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from location-type-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedLocationTypes — paginated list with filtering and sorting
 *  - getLocationTypeById       — full detail fetch by ID
 *  - getLocationTypeLookup     — offset-paginated dropdown lookup
 */

'use strict';

const { query } = require('../database/db');
const { paginateQuery, paginateQueryByOffset } = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildLocationTypeFilter } = require('../utils/sql/build-location-type-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  LOCATION_TYPE_TABLE,
  LOCATION_TYPE_JOINS,
  LOCATION_TYPE_PAGINATED_SORT_WHITELIST,
  buildLocationTypePaginatedQuery,
  LOCATION_TYPE_GET_BY_ID,
  LOCATION_TYPE_LOOKUP_TABLE,
  LOCATION_TYPE_LOOKUP_SORT_WHITELIST,
  LOCATION_TYPE_LOOKUP_ADDITIONAL_SORTS,
  buildLocationTypeLookupQuery,
} = require('./queries/location-type-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated location type records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]             - Field filters.
 * @param {number}       [options.page=1]                 - Page number (1-based).
 * @param {number}       [options.limit=10]               - Records per page.
 * @param {string}       [options.sortBy='lt.created_at'] - Whitelisted DB column.
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']       - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedLocationTypes = async ({
                                           filters   = {},
                                           page      = 1,
                                           limit     = 10,
                                           sortBy    = 'lt.created_at',  // raw DB column — must match whitelist
                                           sortOrder = 'DESC',
                                         }) => {
  const context = 'location-type-repository/getPaginatedLocationTypes';
  
  const { whereClause, params } = buildLocationTypeFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'locationTypeSortMap',
    defaultSort: SORTABLE_FIELDS.locationTypeSortMap.defaultNaturalSort,
  });
  
  
  const queryText = buildLocationTypePaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    LOCATION_TYPE_TABLE,
      joins:        LOCATION_TYPE_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: LOCATION_TYPE_PAGINATED_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated location types.',
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

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a full location type record by ID.
 *
 * Returns null if no record exists for the given ID.
 *
 * @param {string} id - UUID of the location type.
 *
 * @returns {Promise<Object|null>} Location type row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getLocationTypeById = async (id) => {
  const context = 'location-type-repository/getLocationTypeById';
  
  try {
    const { rows } = await query(LOCATION_TYPE_GET_BY_ID, [id]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch location type by ID.',
      meta:    { id },
      logFn:   (err) => logDbQueryError(
        LOCATION_TYPE_GET_BY_ID,
        [id],
        err,
        { context, id }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated location type records for dropdown/lookup use.
 *
 * The status join is conditional on canSearchStatus — only included when
 * keyword search needs to match against status names.
 *
 * @param {Object}  params
 * @param {Object}  [params.filters={}]                    - Optional filters (e.g. statusIds, keyword).
 * @param {Object}  [params.options={}]                    - Capability flags.
 * @param {number}  [params.limit=50]                      - Max records per page.
 * @param {number}  [params.offset=0]                      - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getLocationTypeLookup = async ({
                                       filters = {},
                                       options = {},
                                       limit   = 50,
                                       offset  = 0,
                                     }) => {
  const context = 'location-type-repository/getLocationTypeLookup';
  
  const { canSearchStatus = false } = options;
  
  const { whereClause, params } = buildLocationTypeFilter(filters, { canSearchStatus });
  const { queryText, joins } = buildLocationTypeLookupQuery(whereClause, canSearchStatus);
  
  try {
    return await paginateQueryByOffset({
      tableName:       LOCATION_TYPE_LOOKUP_TABLE,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'lt.name',
      sortOrder:       'ASC',
      additionalSorts: LOCATION_TYPE_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    LOCATION_TYPE_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch location type lookup.',
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

module.exports = {
  getPaginatedLocationTypes,
  getLocationTypeById,
  getLocationTypeLookup,
};
