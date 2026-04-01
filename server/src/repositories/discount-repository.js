/**
 * @file discount-repository.js
 * @description Database access layer for discount records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from discount-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getDiscountById      — minimal fetch by ID for order processing
 *  - getDiscountsLookup   — offset-paginated dropdown lookup with optional filtering
 */

'use strict';

const { query } = require('../database/db');
const { paginateQueryByOffset } = require('../database/utils/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildDiscountFilter } = require('../utils/sql/build-discount-filter');
const {
  DISCOUNT_GET_BY_ID,
  DISCOUNT_LOOKUP_TABLE,
  DISCOUNT_LOOKUP_SORT_WHITELIST,
  DISCOUNT_LOOKUP_ADDITIONAL_SORTS,
  buildDiscountLookupQuery,
} = require('./queries/discount-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a minimal discount record by ID.
 *
 * Returns only discount_type and discount_value — used for discount
 * resolution during order processing, not for display.
 *
 * @param {string}       discountId    - UUID of the discount to fetch.
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<{ discount_type: string, discount_value: number }|null>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getDiscountById = async (discountId, client = null) => {
  const context = 'discount-repository/getDiscountById';
  
  try {
    const result = await query(DISCOUNT_GET_BY_ID, [discountId], client);
    return result.rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch discount by ID.',
      meta:    { discountId },
      logFn:   (err) => logDbQueryError(
        DISCOUNT_GET_BY_ID,
        [discountId],
        err,
        { context, discountId }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated discount records for dropdown/lookup use.
 *
 * Sorted by name ascending with valid_from as tie-breaker.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Optional filters (e.g. statusId, discountType).
 * @param {number} [options.limit=50]   - Max records per page.
 * @param {number} [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getDiscountsLookup = async ({ filters = {}, limit = 50, offset = 0 } = {}) => {
  const context = 'discount-repository/getDiscountsLookup';
  
  const { whereClause, params } = buildDiscountFilter(filters);
  const queryText = buildDiscountLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       DISCOUNT_LOOKUP_TABLE,
      joins:           [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'd.name',
      sortOrder:       'ASC',
      additionalSorts: DISCOUNT_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    DISCOUNT_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch discounts lookup.',
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
  getDiscountById,
  getDiscountsLookup,
};
