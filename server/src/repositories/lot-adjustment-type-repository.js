/**
 * @file lot-adjustment-type-repository.js
 * @description Database access layer for lot adjustment type records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from lot-adjustment-type-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getLotAdjustmentTypeLookup — offset-paginated lookup with optional filtering
 */

'use strict';

const {
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  buildLotAdjustmentTypeFilter,
} = require('../utils/sql/build-lot-adjustment-type-filter');
const {
  LOT_ADJUSTMENT_TYPE_TABLE,
  LOT_ADJUSTMENT_TYPE_JOINS,
  LOT_ADJUSTMENT_TYPE_SORT_WHITELIST,
  buildLotAdjustmentTypeLookupQuery,
} = require('./queries/lot-adjustment-type-queries');

const CONTEXT = 'lot-adjustment-type-repository';

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated lot adjustment type records with optional filtering.
 *
 * Sorted by name ascending — intended for dropdown/selection use.
 *
 * Active-only enforcement is now a business rule: the business layer should
 * pass `filters.isActive: true` for user-facing lookups to keep inactive
 * types hidden. Previously this was hardcoded in the filter builder.
 *
 * @param {Object}  options
 * @param {Object}  [options.filters={}] - Optional filters (e.g. isActive, actionTypeCategories, excludeNames).
 * @param {number}  [options.limit=50]   - Max records per page.
 * @param {number}  [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getLotAdjustmentTypeLookup = async ({
                                            filters = {},
                                            limit = 50,
                                            offset = 0,
                                          }) => {
  const context = `${CONTEXT}/getLotAdjustmentTypeLookup`;
  
  const { whereClause, params } = buildLotAdjustmentTypeFilter(filters);
  const queryText = buildLotAdjustmentTypeLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName: LOT_ADJUSTMENT_TYPE_TABLE,
      joins: LOT_ADJUSTMENT_TYPE_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'lat.name',
      sortOrder: 'ASC',
      whitelistSet: LOT_ADJUSTMENT_TYPE_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch lot adjustment type lookup.',
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
  getLotAdjustmentTypeLookup,
};
