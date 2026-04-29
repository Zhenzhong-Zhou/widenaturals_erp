/**
 * @file pricing-repository.js
 * @description Database access layer for pricing join table records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from pricing-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedPricingJoin       — paginated pricing join list (scoped by group, type, SKU, or cross-group)
 *  - exportAllPricingRecords       — full export with filters and sorting
 *  - getPricingBySkuId             — all pricing groups a SKU belongs to
 *  - getPricesByGroupAndSkuBatch   — batch price fetch by (pricing_group_id, sku_id) pairs
 */

'use strict';

const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  buildPricingJoinFilters,
  buildPricingExportFilters,
} = require('../utils/sql/build-pricing-filter');
const {
  PRICING_JOIN_TABLE,
  PRICING_JOIN_JOINS,
  PRICING_JOIN_SORT_WHITELIST,
  buildPricingJoinQuery,
  buildPricingExportQuery,
  PRICING_BY_SKU_QUERY,
  PRICING_BY_GROUP_AND_SKU_BATCH_QUERY,
} = require('./queries/pricing-queries');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');

const CONTEXT = 'pricing-repository';

// ─── Pricing Join List ────────────────────────────────────────────────────────

/**
 * Fetches a paginated pricing join list scoped by an optional fixed filter
 * (e.g. pricingGroupId, pricingTypeId, skuId) plus user-supplied filters.
 *
 * Supports filtering by brand, product, SKU, country code, and free-text search.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]               - Field filters (includes any fixed scope filter).
 * @param {number}       [options.page=1]                   - Page number (1-based).
 * @param {number}       [options.limit=20]                 - Page size.
 * @param {string}       [options.sortBy='productName']     - Sort key (from pricingJoinSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']          - Sort direction.
 * @returns {Promise<PaginatedResult>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPaginatedPricingJoin = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'productName',
  sortOrder = 'ASC',
}) => {
  const context = `${CONTEXT}/getPaginatedPricingJoin`;
  const { whereClause, params } = buildPricingJoinFilters(filters);
  const queryText = buildPricingJoinQuery(whereClause);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'pricingJoinSortMap',
    defaultSort: SORTABLE_FIELDS.pricingJoinSortMap.defaultNaturalSort,
  });

  try {
    return await paginateQuery({
      tableName: PRICING_JOIN_TABLE,
      joins: PRICING_JOIN_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: PRICING_JOIN_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated pricing join records.',
      meta: { filters, page, limit },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          page,
          limit,
        }),
    });
  }
};

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Fetches all pricing records matching filters for export.
 *
 * Returns all rows without pagination — intended for CSV/Excel export flows.
 * ORDER BY is baked into buildPricingExportQuery.
 *
 * @param {Object} [options]
 * @param {Object} [options.filters={}] - Field filters.
 * @returns {Promise<Array<Object>>} All matching pricing rows.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const exportAllPricingRecords = async ({ filters = {} } = {}) => {
  const context = `${CONTEXT}/exportAllPricingRecords`;
  const { whereClause, params } = buildPricingExportFilters(filters);
  const queryText = buildPricingExportQuery(whereClause);

  try {
    const { rows } = await query(queryText, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to export pricing records.',
      meta: { filters },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, { context, filters }),
    });
  }
};

// ─── By SKU ───────────────────────────────────────────────────────────────────

/**
 * Fetches all pricing groups a SKU belongs to.
 *
 * Returns an empty array if the SKU has no pricing assignments.
 *
 * @param {string} skuId - UUID of the SKU.
 * @returns {Promise<Array<Object>>} Pricing rows ordered by price type code, country, valid_from.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricingBySkuId = async (skuId) => {
  const context = `${CONTEXT}/getPricingBySkuId`;

  try {
    const { rows } = await query(PRICING_BY_SKU_QUERY, [skuId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing groups for SKU.',
      meta: { skuId },
      logFn: (err) =>
        logDbQueryError(PRICING_BY_SKU_QUERY, [skuId], err, { context, skuId }),
    });
  }
};

// ─── Batch Fetch by (pricing_group_id, sku_id) Pairs ─────────────────────────

/**
 * Fetches prices for a batch of (pricing_group_id, sku_id) pairs.
 *
 * Returns only rows where both IDs match — unmatched pairs are silently dropped.
 * Returns an empty array if pairs is empty.
 *
 * @param {Array<{ pricing_group_id: string, sku_id: string }>} pairs
 * @param {import('pg').PoolClient|null} [client=null]
 * @returns {Promise<Array<{ pricing_group_id: string, sku_id: string, price: string }>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricesByGroupAndSkuBatch = async (pairs, client = null) => {
  if (!pairs?.length) return [];

  const context = `${CONTEXT}/getPricesByGroupAndSkuBatch`;
  const pricingGroupIds = pairs.map((p) => p.pricing_group_id);
  const skuIds = pairs.map((p) => p.sku_id);
  const params = [pricingGroupIds, skuIds];

  try {
    const { rows } = await query(
      PRICING_BY_GROUP_AND_SKU_BATCH_QUERY,
      params,
      client
    );
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch prices for group/SKU pairs.',
      meta: { pairCount: pairs.length },
      logFn: (err) =>
        logDbQueryError(PRICING_BY_GROUP_AND_SKU_BATCH_QUERY, params, err, {
          context,
        }),
    });
  }
};

module.exports = {
  getPaginatedPricingJoin,
  exportAllPricingRecords,
  getPricingBySkuId,
  getPricesByGroupAndSkuBatch,
};
