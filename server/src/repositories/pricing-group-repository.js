const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  PRICING_PRICE_BY_GROUP_SKU_PAIRS_QUERY,
  buildPricingGroupLookupQuery,
  PRICING_GROUP_LOOKUP_TABLE,
  PRICING_GROUP_LOOKUP_JOINS,
  PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS,
  PRICING_GROUP_LOOKUP_SORT_WHITELIST
} = require('./queries/pricing-group-queries');
const { paginateQueryByOffset } = require('../utils/db/pagination/pagination-helpers');
const { buildPricingGroupFilters } = require('../utils/sql/build-pricing-group-filter');

const CONTEXT = 'pricing_group_repository';

// ─── Batch Fetch By ID + SKU Pairs ────────────────────────────────────────────

/**
 * Fetches pricing records for a batch of price_id + sku_id pairs.
 *
 * Returns only rows where both IDs match — unmatched pairs are silently dropped.
 * Returns an empty array if pairs is empty.
 *
 * @param {Array<{ pricing_id: string, sku_id: string }>} pairs    - Pairs to fetch.
 * @param {PoolClient|null}                [client=null]
 *
 * @returns {Promise<Array<{ pricing_id: string, sku_id: string, price: string }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricesByGroupAndSkuPairs = async (pairs, client = null) => {
  if (!pairs?.length) return [];
  
  const context         = `${CONTEXT}/getPricesByGroupAndSkuPairs`;
  const pricingIds = pairs.map((p) => p.pricing_id);
  const skuIds          = pairs.map((p) => p.sku_id);
  const params = [pricingIds, skuIds];
  
  try {
    const { rows } = await query(PRICING_PRICE_BY_GROUP_SKU_PAIRS_QUERY, params, client);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch prices for group/SKU pairs.',
      meta:    { pairCount: pairs.length },
      logFn:   (err) => logDbQueryError(
        PRICING_PRICE_BY_GROUP_SKU_PAIRS_QUERY, params, err, { context }
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
const getPricingGroupLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = `${CONTEXT}/getPricingGroupLookup`;
  
  const { whereClause, params } = buildPricingGroupFilters(filters);
  const queryText = buildPricingGroupLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       PRICING_GROUP_LOOKUP_TABLE,
      joins:           PRICING_GROUP_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'pt.name',
      sortOrder:       'ASC',
      additionalSorts: PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    PRICING_GROUP_LOOKUP_SORT_WHITELIST,
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

module.exports = {
  getPricesByGroupAndSkuPairs,
  getPricingGroupLookup,
};
