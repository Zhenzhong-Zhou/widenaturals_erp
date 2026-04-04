/**
 * @file pricing-type-repository.js
 * @description Database access layer for pricing type records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from pricing-type-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getAllPriceTypes              — paginated list with optional filtering
 *  - getPricingTypeById           — full detail fetch by id
 *  - checkPriceTypeExists         — existence check by id
 *  - getPricingTypesForDropdown   — dropdown fetch by product id
 */

'use strict';

const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildPricingTypeFilter } = require('../utils/sql/build-pricing-type-filter');
const {
  PRICING_TYPE_TABLE,
  PRICING_TYPE_JOINS,
  PRICING_TYPE_SORT_WHITELIST,
  buildPricingTypePaginatedQuery,
  PRICING_TYPE_GET_BY_ID_QUERY,
  PRICING_TYPE_EXISTS_QUERY,
  PRICING_TYPE_DROPDOWN_QUERY,
} = require('./queries/pricing-type-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated pricing type records with optional filtering.
 *
 * Status filter behaviour is controlled by `canViewAllStatuses`:
 *  - false → statusId always applied
 *  - true + no statusId → no status condition
 *  - true + statusId → statusId still applied
 *
 * @param {Object}  options
 * @param {number}  [options.page=1]                - Page number (1-based).
 * @param {number}  [options.limit=10]              - Records per page.
 * @param {string}  [options.statusId]              - Filter by status UUID.
 * @param {string}  [options.search]                - ILIKE search across name and code.
 * @param {string}  [options.startDate]             - Lower bound for status_date (BETWEEN).
 * @param {string}  [options.endDate]               - Upper bound for status_date (BETWEEN).
 * @param {boolean} [options.canViewAllStatuses]    - If true, status filter is optional.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getAllPriceTypes = async ({
                                  page,
                                  limit,
                                  statusId,
                                  search,
                                  startDate,
                                  endDate,
                                  canViewAllStatuses = false,
                                }) => {
  const context = 'pricing-type-repository/getAllPriceTypes';
  
  const { whereClause, params } = buildPricingTypeFilter({
    statusId,
    canViewAllStatuses,
    search,
    startDate,
    endDate,
  });
  
  const queryText = buildPricingTypePaginatedQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    PRICING_TYPE_TABLE,
      joins:        PRICING_TYPE_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       'pt.name',
      sortOrder:    'ASC',
      whitelistSet: PRICING_TYPE_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated pricing types.',
      meta:    { page, limit },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, page, limit }
      ),
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches full pricing type detail by ID.
 *
 * Returns null if no record exists for the given ID.
 *
 * @param {string} pricingTypeId - UUID of the pricing type.
 *
 * @returns {Promise<Object|null>} Pricing type detail row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getPricingTypeById = async (pricingTypeId) => {
  const context = 'pricing-type-repository/getPricingTypeById';
  
  try {
    const { rows } = await query(PRICING_TYPE_GET_BY_ID_QUERY, [pricingTypeId]);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing type by ID.',
      meta:    { pricingTypeId },
      logFn:   (err) => logDbQueryError(
        PRICING_TYPE_GET_BY_ID_QUERY, [pricingTypeId], err, { context, pricingTypeId }
      ),
    });
  }
};

// ─── Existence Check ──────────────────────────────────────────────────────────

/**
 * Checks whether a pricing type exists by ID.
 *
 * @param {string}                  priceTypeId   - UUID to check.
 * @param {PoolClient|null} [client=null]
 *
 * @returns {Promise<boolean>} True if the pricing type exists.
 * @throws  {AppError}          Normalized database error if the query fails.
 */
const checkPriceTypeExists = async (priceTypeId, client = null) => {
  const context = 'pricing-type-repository/checkPriceTypeExists';
  
  try {
    const { rows } = await query(PRICING_TYPE_EXISTS_QUERY, [priceTypeId], client);
    return rows[0]?.exists ?? false;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check pricing type existence.',
      meta:    { priceTypeId },
      logFn:   (err) => logDbQueryError(
        PRICING_TYPE_EXISTS_QUERY, [priceTypeId], err, { context, priceTypeId }
      ),
    });
  }
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────

/**
 * Fetches active pricing types with price labels for a given product.
 *
 * Returns rows ordered by pricing type name ascending.
 *
 * @param {string} productId - UUID of the product.
 *
 * @returns {Promise<Array<{ id: string, label: string }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricingTypesForDropdown = async (productId) => {
  const context = 'pricing-type-repository/getPricingTypesForDropdown';
  
  try {
    const { rows } = await query(PRICING_TYPE_DROPDOWN_QUERY, [productId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing types for dropdown.',
      meta:    { productId },
      logFn:   (err) => logDbQueryError(
        PRICING_TYPE_DROPDOWN_QUERY, [productId], err, { context, productId }
      ),
    });
  }
};

module.exports = {
  getAllPriceTypes,
  getPricingTypeById,
  checkPriceTypeExists,
  getPricingTypesForDropdown,
};
