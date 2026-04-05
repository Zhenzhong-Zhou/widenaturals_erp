/**
 * @file tax-rate-repository.js
 * @description Database access layer for tax rate records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from tax-rate-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getTaxRateById    — fetch a single tax rate scalar value by id
 *  - getTaxRatesLookup — offset-paginated tax rate dropdown list
 */

'use strict';

const { getUniqueScalarValue } = require('../utils/db/record-utils');
const { paginateQueryByOffset } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildTaxRateFilter } = require('../utils/sql/build-tax-rate-filter');
const {
  TAX_RATE_TABLE,
  TAX_RATE_LOOKUP_SORT_WHITELIST,
  buildTaxRateLookupQuery,
} = require('./queries/tax-rate-queries');

// ─── Scalar Lookup ────────────────────────────────────────────────────────────

/**
 * Fetches the rate scalar for a single tax rate by id.
 *
 * Delegates to getUniqueScalarValue which handles not-found and logging.
 *
 * @param {string}                  taxRateId - UUID of the tax rate to fetch.
 * @param {PoolClient} [client]  - Optional transaction client.
 *
 * @returns {Promise<number|null>} Tax rate scalar, or null if not found.
 * @throws  {AppError} Propagated from getUniqueScalarValue.
 */
const getTaxRateById = async (taxRateId, client = null) => {
  return getUniqueScalarValue(
    {
      table:  'tax_rates',
      where:  { id: taxRateId },
      select: 'rate',
    },
    client,
    {
      context: 'tax-rate-repository/getTaxRateById',
      taxRateId,
    }
  );
};

// ─── Lookup (Dropdown) ────────────────────────────────────────────────────────

/**
 * Fetches offset-paginated tax rate records for dropdown/lookup use.
 *
 * @param {Object}  options
 * @param {Object}  [options.filters={}] - Field filters.
 * @param {number}  [options.limit=50]   - Records per page.
 * @param {number}  [options.offset=0]   - Record offset.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getTaxRatesLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'tax-rate-repository/getTaxRatesLookup';
  
  const { whereClause, params } = buildTaxRateFilter(filters);
  
  const queryText = buildTaxRateLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:    TAX_RATE_TABLE,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:       'tr.name',
      sortOrder:    'ASC',
      whitelistSet: TAX_RATE_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch tax rate options.',
      meta:    { filters, offset, limit },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, offset, limit }
      ),
    });
  }
};

module.exports = {
  getTaxRateById,
  getTaxRatesLookup,
};
