/**
 * @file pricing-repository.js
 * @description Database access layer for pricing records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from pricing-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedPricings              — paginated list with filtering and sorting
 *  - exportAllPricingRecords           — full result set export with sorting
 *  - getPricingDetailsByPricingTypeId  — paginated details by pricing type
 *  - getPricingBySkuId                 — fetch all pricing rows for a SKU
 */

'use strict';

const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildPricingFilters } = require('../utils/sql/build-pricing-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  PRICING_TABLE,
  PRICING_JOINS,
  PRICING_SORT_WHITELIST,
  buildPricingSelectQuery,
  PRICING_DETAILS_TABLE,
  PRICING_DETAILS_JOINS,
  PRICING_DETAILS_SORT_WHITELIST,
  buildPricingDetailsQuery,
  PRICING_BY_SKU_QUERY,
} = require('./queries/pricing-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated pricing records with optional filtering and sorting.
 *
 * @param {Object}       options
 * @param {number}       [options.page=1]           - Page number (1-based).
 * @param {number}       [options.limit=10]          - Records per page.
 * @param {string}       [options.sortBy='brand']    - Sort key (mapped via pricingSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']  - Sort direction.
 * @param {Object}       [options.filters={}]        - Field filters.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedPricings = async ({
                                      page,
                                      limit,
                                      sortBy    = 'brand',
                                      sortOrder,
                                      filters   = {},
                                    }) => {
  const context = 'pricing-repository/getPaginatedPricings';
  
  const { whereClause, params } = buildPricingFilters(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'pricingSortMap',
    defaultSort: SORTABLE_FIELDS.pricingSortMap.defaultNaturalSort,
  });
  
  const queryText = buildPricingSelectQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    PRICING_TABLE,
      joins:        PRICING_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: PRICING_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated pricing records.',
      meta:    { filters, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters }
      ),
    });
  }
};

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Fetches all pricing records matching filters for export.
 *
 * Returns all rows without pagination — intended for CSV/Excel export flows.
 *
 * @param {Object}       options
 * @param {string}       [options.sortBy='brand']   - Sort key (mapped via pricingSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']  - Sort direction.
 * @param {Object}       [options.filters={}]       - Field filters.
 *
 * @returns {Promise<Array<Object>>} All matching pricing rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const exportAllPricingRecords = async ({
                                         sortBy    = 'brand',
                                         sortOrder = 'ASC',
                                         filters   = {},
                                       }) => {
  const context = 'pricing-repository/exportAllPricingRecords';
  
  const { whereClause, params } = buildPricingFilters(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'pricingSortMap',
    defaultSort: SORTABLE_FIELDS.pricingSortMap.defaultNaturalSort,
  });
  
  // ORDER BY appended directly — this is a plain query(), not paginateQuery().
  const queryText = `
    ${buildPricingSelectQuery(whereClause)}
    ORDER BY ${sortConfig.sortBy} ${sortConfig.sortOrder}
  `;
  
  try {
    const { rows } = await query(queryText, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to export pricing records.',
      meta:    { filters, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters }
      ),
    });
  }
};

// ─── Details By Pricing Type ──────────────────────────────────────────────────

/**
 * Fetches paginated pricing detail records for a given pricing type.
 *
 * Aggregates SKU and product data grouped by pricing configuration fields.
 *
 * @param {Object} options
 * @param {string} options.pricingTypeId - UUID of the pricing type.
 * @param {number} [options.page=1]      - Page number (1-based).
 * @param {number} [options.limit=10]    - Records per page.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPricingDetailsByPricingTypeId = async ({ pricingTypeId, page, limit }) => {
  const context  = 'pricing-repository/getPricingDetailsByPricingTypeId';
  const queryText = buildPricingDetailsQuery();
  const params    = [pricingTypeId];
  
  try {
    return await paginateQuery({
      tableName:    PRICING_DETAILS_TABLE,
      joins:        PRICING_DETAILS_JOINS,
      whereClause:  'p.price_type_id = $1',
      queryText,
      params,
      page,
      limit,
      sortBy:       'pr.name',
      sortOrder:    'ASC',
      whitelistSet: PRICING_DETAILS_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing details.',
      meta:    { pricingTypeId, page, limit },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, pricingTypeId }
      ),
    });
  }
};

// ─── By SKU ───────────────────────────────────────────────────────────────────

/**
 * Fetches all pricing records for a given SKU.
 *
 * Returns an empty array if no pricing records exist for the SKU.
 *
 * @param {string} skuId - UUID of the SKU.
 *
 * @returns {Promise<Array<Object>>} Pricing rows ordered by price_type code and valid_from.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getPricingBySkuId = async (skuId) => {
  const context = 'pricing-repository/getPricingBySkuId';
  
  try {
    const { rows } = await query(PRICING_BY_SKU_QUERY, [skuId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU pricing.',
      meta:    { skuId },
      logFn:   (err) => logDbQueryError(
        PRICING_BY_SKU_QUERY, [skuId], err, { context, skuId }
      ),
    });
  }
};

module.exports = {
  getPaginatedPricings,
  exportAllPricingRecords,
  getPricingDetailsByPricingTypeId,
  getPricingBySkuId,
};
