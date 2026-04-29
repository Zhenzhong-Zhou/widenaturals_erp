/**
 * @file pricing-group-repository.js
 * @description Database access layer for pricing group records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from pricing-group-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedPricingGroups    — paginated group list with SKU/product counts
 *  - getPricingGroupById    — single group record for detail page header
 *  - getPricingGroupLookup  — offset-paginated lookup for dropdowns
 */

'use strict';

const {
  paginateQuery,
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  buildPricingGroupFilters,
} = require('../utils/sql/build-pricing-group-filter');
const {
  PRICING_GROUP_TABLE,
  PRICING_GROUP_JOINS,
  PRICING_GROUP_SORT_WHITELIST,
  buildPricingGroupPaginatedQuery,
  PRICING_GROUP_BY_ID_QUERY,
  PRICING_GROUP_LOOKUP_TABLE,
  PRICING_GROUP_LOOKUP_JOINS,
  PRICING_GROUP_LOOKUP_SORT_WHITELIST,
  PRICING_GROUP_LOOKUP_SORT_MAP,
  PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS,
  buildPricingGroupLookupQuery,
} = require('./queries/pricing-group-queries');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');

const CONTEXT = 'pricing-group-repository';

// ─── Group List ───────────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of pricing groups with SKU and product counts.
 *
 * Used for the pricing type detail page — groups are always scoped to a
 * pricing type via filters.pricingTypeId.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]         - Field filters (pricingTypeId, countryCode, statusId, etc.)
 * @param {number}       [options.page=1]             - Page number (1-based).
 * @param {number}       [options.limit=20]           - Page size.
 * @param {string}       [options.sortBy='pt.name']   - Sort column (from pricingGroupSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']    - Sort direction.
 * @returns {Promise<PaginatedResult>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPaginatedPricingGroups = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'pricingTypeName',
  sortOrder = 'ASC',
}) => {
  const context = `${CONTEXT}/getPaginatedPricingGroups`;
  const { whereClause, params } = buildPricingGroupFilters(filters);
  const queryText = buildPricingGroupPaginatedQuery(whereClause);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'pricingGroupSortMap',
    defaultSort: SORTABLE_FIELDS.pricingGroupSortMap.defaultNaturalSort,
  });

  try {
    return await paginateQuery({
      tableName: PRICING_GROUP_TABLE,
      joins: PRICING_GROUP_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: PRICING_GROUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing group list.',
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

// ─── By ID ────────────────────────────────────────────────────────────────────

/**
 * Fetches a single pricing group by ID for the detail page header.
 *
 * Returns null if not found.
 *
 * @param {string} pricingGroupId - UUID of the pricing group.
 * @returns {Promise<Object|null>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricingGroupById = async (pricingGroupId) => {
  const context = `${CONTEXT}/getPricingGroupById`;

  const params = [pricingGroupId];

  try {
    const { rows } = await query(PRICING_GROUP_BY_ID_QUERY, params);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing group by ID.',
      meta: { pricingGroupId },
      logFn: (err) =>
        logDbQueryError(PRICING_GROUP_BY_ID_QUERY, params, err, {
          context,
          pricingGroupId,
        }),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches offset-paginated pricing groups for dropdown/lookup use.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Optional filters.
 * @param {number} [options.limit=50]   - Max records per page.
 * @param {number} [options.offset=0]   - Offset for pagination.
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPaginatedPricingGroupLookup = async ({
  filters = {},
  limit = 50,
  offset = 0,
}) => {
  const context = `${CONTEXT}/getPricingGroupLookup`;
  const { whereClause, params } = buildPricingGroupFilters(filters);
  const queryText = buildPricingGroupLookupQuery(whereClause);

  try {
    return await paginateQueryByOffset({
      tableName: PRICING_GROUP_LOOKUP_TABLE,
      joins: PRICING_GROUP_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'pt.name',
      sortOrder: 'ASC',
      additionalSorts: PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet: PRICING_GROUP_LOOKUP_SORT_WHITELIST,
      sortMap: PRICING_GROUP_LOOKUP_SORT_MAP,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing group lookup.',
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
  getPaginatedPricingGroups,
  getPricingGroupById,
  getPaginatedPricingGroupLookup,
};
