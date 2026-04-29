/**
 * @file bom-repository.js
 * @description Database access layer for BOM records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from bom-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedBoms         — paginated BOM list with filtering and sorting
 *  - getBomDetailsById        — full detail fetch with items and parts
 *  - getBomProductionSummary  — CTE-based production summary by bom_id
 */

'use strict';

const { query } = require('../database/db');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildBomFilter } = require('../utils/sql/build-bom-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  BOM_TABLE,
  BOM_JOINS,
  BOM_SORT_WHITELIST,
  BOM_ADDITIONAL_SORTS,
  buildBomPaginatedQuery,
  BOM_DETAILS_QUERY,
  BOM_PRODUCTION_SUMMARY_QUERY,
} = require('./queries/bom-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated BOM records with optional filtering and sorting.
 *
 * Joins SKU, product, compliance, status, and audit user fields.
 * Applies deterministic tie-breaking via BOM_ADDITIONAL_SORTS.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='createdAt']   - Sort key (mapped via bomSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedBoms = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'createdAt', // map key, not DB column
  sortOrder = 'DESC',
}) => {
  const context = 'bom-repository/getPaginatedBoms';

  const { whereClause, params } = buildBomFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'bomSortMap',
    defaultSort: SORTABLE_FIELDS.bomSortMap.defaultNaturalSort,
  });

  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildBomPaginatedQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: BOM_TABLE,
      joins: BOM_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      additionalSorts: BOM_ADDITIONAL_SORTS,
      whitelistSet: BOM_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated BOM list.',
      meta: { filters, page, limit, sortBy, sortOrder },
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

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full BOM detail by ID including items, parts, compliance, and audit fields.
 *
 * Returns multiple rows per BOM — one per bom_item/part combination.
 * Returns an empty array if no rows match.
 *
 * @param {string} bomId - UUID of the BOM to fetch.
 *
 * @returns {Promise<Array<Object>>} BOM detail rows ordered by item id and part type.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getBomDetailsById = async (bomId) => {
  const context = 'bom-repository/getBomDetailsById';

  try {
    const result = await query(BOM_DETAILS_QUERY, [bomId]);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch BOM details.',
      meta: { bomId },
      logFn: (err) =>
        logDbQueryError(BOM_DETAILS_QUERY, [bomId], err, { context, bomId }),
    });
  }
};

// ─── Production Summary ───────────────────────────────────────────────────────

/**
 * Fetches a CTE-based production summary for a given BOM.
 *
 * Computes per-part inventory availability, shortage quantities, and
 * max producible units based on current warehouse stock.
 *
 * Returns an empty array if no rows match.
 *
 * @param {string} bomId - UUID of the BOM to summarise.
 *
 * @returns {Promise<Array<Object>>} Production summary rows per part.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getBomProductionSummary = async (bomId) => {
  const context = 'bom-repository/getBomProductionSummary';

  try {
    const result = await query(BOM_PRODUCTION_SUMMARY_QUERY, [bomId]);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch BOM production summary.',
      meta: { bomId },
      logFn: (err) =>
        logDbQueryError(BOM_PRODUCTION_SUMMARY_QUERY, [bomId], err, {
          context,
          bomId,
        }),
    });
  }
};

module.exports = {
  getPaginatedBoms,
  getBomDetailsById,
  getBomProductionSummary,
};
