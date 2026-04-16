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
 *  - getPricingTypeList   — paginated list with optional filtering
 *  - getPricingTypeById   — full detail fetch by id
 */

'use strict';

const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  buildPricingTypeFilter,
} = require('../utils/sql/build-pricing-type-filter');
const {
  PRICING_TYPE_TABLE,
  PRICING_TYPE_JOINS,
  PRICING_TYPE_SORT_WHITELIST,
  buildPricingTypePaginatedQuery,
  PRICING_TYPE_GET_BY_ID_QUERY,
} = require('./queries/pricing-type-queries');

const CONTEXT = 'pricing-type-repository';

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated pricing type records with optional filtering.
 *
 * Status filter behaviour is controlled by `canViewAllStatuses` inside filters:
 *  - false → statusId always applied
 *  - true + no statusId → no status condition
 *  - true + statusId → statusId still applied
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]          - Field filters (statusId, search, startDate, endDate, canViewAllStatuses).
 * @param {number}       [options.page=1]              - Page number (1-based).
 * @param {number}       [options.limit=10]            - Records per page.
 * @param {string}       [options.sortBy='pricingTypeName'] - Sort key (from pricingTypeSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']     - Sort direction.
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPaginatedPricingTypes = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'pricingTypeName',
  sortOrder = 'ASC',
}) => {
  const context = `${CONTEXT}/getPricingTypeList`;
  const { whereClause, params } = buildPricingTypeFilter(filters);
  const queryText = buildPricingTypePaginatedQuery(whereClause);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'pricingTypeSortMap',
    defaultSort: SORTABLE_FIELDS.pricingTypeSortMap.defaultNaturalSort,
  });

  try {
    return await paginateQuery({
      tableName: PRICING_TYPE_TABLE,
      joins: PRICING_TYPE_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: PRICING_TYPE_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated pricing types.',
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

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches full pricing type detail by ID.
 *
 * Returns null if no record exists for the given ID.
 *
 * @param {string} pricingTypeId - UUID of the pricing type.
 * @returns {Promise<Object|null>} Pricing type detail row, or null if not found.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPricingTypeById = async (pricingTypeId) => {
  const context = `${CONTEXT}/getPricingTypeById`;
  const params = [pricingTypeId];

  try {
    const { rows } = await query(PRICING_TYPE_GET_BY_ID_QUERY, params);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch pricing type by ID.',
      meta: { pricingTypeId },
      logFn: (err) =>
        logDbQueryError(PRICING_TYPE_GET_BY_ID_QUERY, params, err, {
          context,
          pricingTypeId,
        }),
    });
  }
};

module.exports = {
  getPaginatedPricingTypes,
  getPricingTypeById,
};
