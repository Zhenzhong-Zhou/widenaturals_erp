/**
 * @file location-repository.js
 * @description Repository functions for the locations table.
 *
 * Pattern notes:
 *  - All SQL lives in queries/location-queries.js — never inline here.
 *  - Filter builders are imported from utils/sql/build-location-filter.
 *  - DB errors are wrapped via handleDbError + logDbQueryError; AppErrors
 *    propagate unchanged. No success logging — globalErrorHandler owns
 *    error formatting.
 *
 * Exports:
 *  - getPaginatedLocations       — paginated list with filtering and sorting
 *  - getLocationLookup           — paginated lookup query for dropdowns
 */

'use strict';

const {
  paginateQuery,
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildLocationFilter } = require('../utils/sql/build-location-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  LOCATION_TABLE,
  LOCATION_JOINS,
  LOCATION_SORT_WHITELIST,
  buildLocationQuery,
  buildLocationLookupQuery,
  LOCATION_LOOKUP_TABLE,
  LOCATION_LOOKUP_JOINS,
  LOCATION_LOOKUP_ADDITIONAL_SORTS,
  LOCATION_LOOKUP_SORT_WHITELIST,
} = require('./queries/location-queries');

const CONTEXT = 'location-repository';

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated location records with optional filtering and sorting.
 *
 * Joins status, location type, and audit user fields.
 * Archived locations are excluded by default — pass includeArchived: true
 * in filters to include them.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]            - Field filters.
 * @param {number}       [options.page=1]                - Page number (1-based).
 * @param {number}       [options.limit=10]              - Records per page.
 * @param {string}       [options.sortBy='l.created_at'] - Whitelisted DB column.
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']      - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedLocations = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) => {
  const context = `${CONTEXT}/getPaginatedLocations`;

  const { whereClause, params } = buildLocationFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'locationSortMap',
    defaultSort: SORTABLE_FIELDS.locationSortMap.defaultNaturalSort,
  });

  // ORDER BY omitted — paginateQuery appends it from sortBy/sortOrder.
  const queryText = buildLocationQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: LOCATION_TABLE,
      joins: LOCATION_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: LOCATION_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated locations.',
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

/**
 * Fetches a paginated lookup of locations.
 *
 * @param {LocationFilters} [filters={}]
 * @param {number}          [limit=50]
 * @param {number}          [offset=0]
 * @returns {Promise<PaginatedOffsetResult<LocationLookupRow>>}
 */
const getLocationLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/getLocationLookup`;
  const { whereClause, params } = buildLocationFilter(filters);
  const queryText = buildLocationLookupQuery(whereClause);

  try {
    return /** @type {PaginatedOffsetResult<LocationLookupRow>} */ (
      await paginateQueryByOffset({
        tableName: LOCATION_LOOKUP_TABLE,
        joins: LOCATION_LOOKUP_JOINS,
        whereClause,
        queryText,
        params,
        offset,
        limit,
        sortBy: 'l.name',
        sortOrder: 'ASC',
        additionalSorts: LOCATION_LOOKUP_ADDITIONAL_SORTS,
        whitelistSet: LOCATION_LOOKUP_SORT_WHITELIST,
      })
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch location lookup.',
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

module.exports = {
  getPaginatedLocations,
  getLocationLookup,
};
