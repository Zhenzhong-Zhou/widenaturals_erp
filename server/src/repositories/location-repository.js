/**
 * @file location-repository.js
 * @description Database access layer for location records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from location-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedLocations — paginated list with filtering and sorting
 */

'use strict';

const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
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
} = require('./queries/location-queries');

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
  const context = 'location-repository/getPaginatedLocations';

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

module.exports = {
  getPaginatedLocations,
};
