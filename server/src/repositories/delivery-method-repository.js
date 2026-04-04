/**
 * @file delivery-method-repository.js
 * @description Database access layer for delivery method records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from delivery-method-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getDeliveryMethodsLookup — offset-paginated dropdown lookup with optional filtering
 */

'use strict';

const { paginateQueryByOffset } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildDeliveryMethodFilter } = require('../utils/sql/build-delivery-method-filter');
const {
  DELIVERY_METHOD_TABLE,
  DELIVERY_METHOD_SORT_WHITELIST,
  buildDeliveryMethodLookupQuery,
} = require('./queries/delivery-method-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated delivery method records for dropdown/lookup use.
 *
 * Sorted by method_name ascending — intended for selection interfaces.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Optional filters (e.g. statusId, isPickupLocation).
 * @param {number} [options.limit=50]   - Max records per page.
 * @param {number} [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getDeliveryMethodsLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'delivery-method-repository/getDeliveryMethodsLookup';
  
  const { whereClause, params } = buildDeliveryMethodFilter(filters);
  const queryText = buildDeliveryMethodLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:    DELIVERY_METHOD_TABLE,
      joins:        [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:       'dm.method_name',
      sortOrder:    'ASC',
      whitelistSet: DELIVERY_METHOD_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch delivery methods lookup.',
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
  getDeliveryMethodsLookup,
};
