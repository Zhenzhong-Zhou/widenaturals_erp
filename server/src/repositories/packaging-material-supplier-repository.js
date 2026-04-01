/**
 * @file packaging-material-supplier-repository.js
 * @description Database access layer for packaging material supplier records.
 *
 * Exports:
 *  - getPackagingMaterialSupplierLookup — offset-paginated lookup with optional filtering
 */

'use strict';

const { paginateQueryByOffset } = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildPackagingMaterialSupplierFilter } = require('../utils/sql/build-packaging-material-supplier-filter');
const {
  PMS_TABLE,
  PMS_JOINS,
  PMS_SORT_WHITELIST,
  buildPmsLookupQuery,
} = require('./queries/packaging-material-supplier-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated packaging material supplier records for dropdown/lookup use.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters.
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPackagingMaterialSupplierLookup = async ({
                                                    filters = {},
                                                    limit   = 50,
                                                    offset  = 0,
                                                  }) => {
  const context = 'packaging-material-supplier-repository/getPackagingMaterialSupplierLookup';
  
  const { whereClause, params } = buildPackagingMaterialSupplierFilter(filters);
  const queryText = buildPmsLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:    PMS_TABLE,
      joins:        PMS_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:       's.name',
      sortOrder:    'ASC',
      whitelistSet: PMS_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch packaging material supplier lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, limit, offset }
      ),
    });
  }
};

module.exports = {
  getPackagingMaterialSupplierLookup,
};
