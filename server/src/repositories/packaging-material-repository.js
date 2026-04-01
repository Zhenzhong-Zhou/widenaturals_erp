/**
 * @file packaging-material-repository.js
 * @description Database access layer for packaging material records.
 *
 * Exports:
 *  - getPackagingMaterialsForSalesOrderLookup — offset-paginated lookup for sales order selection
 */

'use strict';

const { paginateQueryByOffset } = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildPackagingMaterialsFilter } = require('../utils/sql/build-packaging-material-filter');
const {
  PM_TABLE,
  PM_SORT_WHITELIST,
  buildPmLookupQuery,
} = require('./queries/packaging-material-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated packaging material records for sales order lookup use.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters (e.g. visibleOnly, statusId).
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPackagingMaterialsForSalesOrderLookup = async ({
                                                          filters = {},
                                                          limit   = 50,
                                                          offset  = 0,
                                                        }) => {
  const context = 'packaging-material-repository/getPackagingMaterialsForSalesOrderLookup';
  
  const { whereClause, params } = buildPackagingMaterialsFilter(filters);
  const queryText = buildPmLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:    PM_TABLE,
      joins:        [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:       'pm.name',
      sortOrder:    'ASC',
      whitelistSet: PM_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch packaging materials lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, limit, offset }
      ),
    });
  }
};

module.exports = {
  getPackagingMaterialsForSalesOrderLookup,
};
