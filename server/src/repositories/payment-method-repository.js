/**
 * @file payment-method-repository.js
 * @description Database access layer for payment method records.
 *
 * Exports:
 *  - getPaymentMethodLookup — offset-paginated dropdown lookup with optional filtering
 */

'use strict';

const {
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  buildPaymentMethodFilter,
} = require('../utils/sql/build-payment-method-filter');
const {
  PAYMENT_METHOD_TABLE,
  PAYMENT_METHOD_SORT_WHITELIST,
  PAYMENT_METHOD_ADDITIONAL_SORTS,
  buildPaymentMethodLookupQuery,
} = require('./queries/payment-method-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated payment method records for dropdown/lookup use.
 *
 * Sorted by display_order ascending with name as tie-breaker.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters (e.g. isActive, keyword).
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaymentMethodLookup = async ({
  filters = {},
  limit = 50,
  offset = 0,
}) => {
  const context = 'payment-method-repository/getPaymentMethodLookup';

  const { whereClause, params } = buildPaymentMethodFilter(filters);
  const queryText = buildPaymentMethodLookupQuery(whereClause);

  try {
    return await paginateQueryByOffset({
      tableName: PAYMENT_METHOD_TABLE,
      joins: [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'pm.display_order',
      sortOrder: 'ASC',
      additionalSorts: PAYMENT_METHOD_ADDITIONAL_SORTS,
      whitelistSet: PAYMENT_METHOD_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch payment method lookup.',
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
  getPaymentMethodLookup,
};
