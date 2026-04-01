/**
 * @file build-vendor-lookup.js
 * @description Shared lookup factory for vendor-type repositories
 * (manufacturers, suppliers) that follow the same conditional join pattern.
 *
 * Both domains support optional status and location joins controlled by
 * capability flags, and share identical pagination/sort structure.
 *
 * Exports:
 *  - buildVendorLookup
 */

'use strict';

const { paginateQueryByOffset } = require('../../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../../utils/errors/error-handlers');
const { logDbQueryError } = require('../../utils/db-logger');

/**
 * Executes an offset-paginated vendor lookup with conditional joins.
 *
 * @param {Object}   params
 * @param {string}   params.context          - Caller context string for error logging.
 * @param {string}   params.tableName        - Aliased table name (e.g. 'manufacturers m').
 * @param {string[]} params.joins            - Pre-built join clauses from the caller.
 * @param {string}   params.whereClause      - Parameterised WHERE predicate.
 * @param {Array}    params.queryParams      - Bound parameter values.
 * @param {string}   params.queryText        - Full SELECT query string.
 * @param {string}   params.sortBy           - Primary sort column.
 * @param {Set}      params.sortWhitelist    - Valid sort columns.
 * @param {Array}    params.additionalSorts  - Tie-break sort columns.
 * @param {number}   params.limit            - Max records per page.
 * @param {number}   params.offset           - Pagination offset.
 * @param {Object}   params.filters          - Original filters for error meta.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const buildVendorLookup = async ({
                                   context,
                                   tableName,
                                   joins,
                                   whereClause,
                                   queryParams,
                                   queryText,
                                   sortBy,
                                   sortWhitelist,
                                   additionalSorts,
                                   limit,
                                   offset,
                                   filters,
                                 }) => {
  try {
    return await paginateQueryByOffset({
      tableName,
      joins,
      whereClause,
      queryText,
      params:          queryParams,
      offset,
      limit,
      sortBy,
      sortOrder:       'ASC',
      additionalSorts,
      whitelistSet:    sortWhitelist,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch vendor lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText,
        queryParams,
        err,
        { context, filters, limit, offset }
      ),
    });
  }
};

module.exports = {
  buildVendorLookup,
};
