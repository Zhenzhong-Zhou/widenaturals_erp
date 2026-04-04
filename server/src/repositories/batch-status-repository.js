/**
 * @file batch-status-repository.js
 * @description Database access layer for batch status records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from batch-status-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getBatchStatusLookup — offset-paginated lookup with optional filtering
 */

'use strict';

const { paginateQueryByOffset } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildBatchStatusFilter } = require('../utils/sql/build-batch-status-filter');
const {
  BATCH_STATUS_TABLE,
  BATCH_STATUS_SORT_WHITELIST,
  buildBatchStatusLookupQuery,
} = require('./queries/batch-status-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated batch status records with optional filtering.
 *
 * Sorted by name ascending — intended for dropdown/selection use.
 *
 * @param {Object}  options
 * @param {Object}  [options.filters={}] - Optional filters (e.g. isActive, batchType).
 * @param {number}  [options.limit=50]   - Max records per page.
 * @param {number}  [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getBatchStatusLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'batch-status-repository/getBatchStatusLookup';
  
  const { whereClause, params } = buildBatchStatusFilter(filters);
  const queryText = buildBatchStatusLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:    BATCH_STATUS_TABLE,
      joins:        [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:       'bs.name',
      sortOrder:    'ASC',
      whitelistSet: BATCH_STATUS_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch batch status lookup.',
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
  getBatchStatusLookup,
};
