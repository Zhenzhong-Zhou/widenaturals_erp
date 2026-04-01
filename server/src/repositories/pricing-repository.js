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
 *  - getPricesByIdAndSkuBatch          — batch fetch by price_id + sku_id pairs
 *  - getPricingLookup                  — offset-paginated dropdown lookup
 *  - getPricingBySkuId                 — fetch all pricing rows for a SKU
 */

'use strict';

const { paginateQuery, paginateQueryByOffset } = require('../database/utils/pagination/pagination-helpers');
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
  PRICING_LOOKUP_TABLE,
  PRICING_LOOKUP_JOINS,
  PRICING_LOOKUP_SORT_WHITELIST,
  PRICING_LOOKUP_ADDITIONAL_SORTS,
  buildPricingLookupQuery,
  PRICING_BY_SKU_QUERY,
  PRICING_BY_ID_AND_SKU_BATCH_QUERY,
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

// ─── Batch Fetch By ID + SKU Pairs ────────────────────────────────────────────

/**
 * Fetches pricing records for a batch of price_id + sku_id pairs.
 *
 * Returns only rows where both IDs match — unmatched pairs are silently dropped.
 * Returns an empty array if pairs is empty.
 *
 * @param {Array<{ price_id: string, sku_id: string }>} pairs    - Pairs to fetch.
 * @param {PoolClient|null}                [client=null]
 *
 * @returns {Promise<Array<{ price_id: string, sku_id: string, price: number }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricesByIdAndSkuBatch = async (pairs, client = null) => {
  if (!pairs?.length) return [];
  
  const context  = 'pricing-repository/getPricesByIdAndSkuBatch';
  const priceIds = pairs.map((p) => p.price_id);
  const skuIds   = pairs.map((p) => p.sku_id);
  const params   = [priceIds, skuIds];
  
  try {
    const { rows } = await query(PRICING_BY_ID_AND_SKU_BATCH_QUERY, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch prices for pairs.',
      meta:    { pairCount: pairs.length },
      logFn:   (err) => logDbQueryError(
        PRICING_BY_ID_AND_SKU_BATCH_QUERY, params, err, { context }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated pricing records for dropdown/lookup use.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters.
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPricingLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'pricing-repository/getPricingLookup';
  
  const { whereClause, params } = buildPricingFilters(filters);
  const queryText = buildPricingLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       PRICING_LOOKUP_TABLE,
      joins:           PRICING_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'pt.name',
      sortOrder:       'ASC',
      additionalSorts: PRICING_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    PRICING_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, limit, offset }
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
  getPricesByIdAndSkuBatch,
  getPricingLookup,
  getPricingBySkuId,
};
