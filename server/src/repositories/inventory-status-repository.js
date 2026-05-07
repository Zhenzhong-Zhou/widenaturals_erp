/**
 * @file inventory-status-repository.js
 * @description
 * Repository for inventory status validation lookups.
 *
 * Exports:
 *  - validateInventoryStatusIds — existence check for a set of status IDs
 *  - getInventoryStatusById     — fetch a single status record by ID
 */

'use strict';

const { query } = require('../database/db');
const {
  VALIDATE_INVENTORY_STATUS_IDS_QUERY,
  GET_INVENTORY_STATUS_BY_ID_QUERY,
  buildInventoryStatusLookupQuery,
  INVENTORY_STATUS_LOOKUP_TABLE,
  INVENTORY_STATUS_LOOKUP_JOINS,
  INVENTORY_STATUS_LOOKUP_ADDITIONAL_SORTS,
  INVENTORY_STATUS_LOOKUP_SORT_WHITELIST,
} = require('./queries/inventory-status-queries');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildInventoryStatusFilters } = require('../utils/sql/build-inventory-status-filter');
const { paginateQueryByOffset } = require('../utils/db/pagination/pagination-helpers');

const CONTEXT = 'inventory-status-repository';

// ── Validate inventory status IDs ───────────────────────────────────

/**
 * Checks which of the given status IDs exist in inventory_status.
 * Returns only the rows that matched — caller compares against input to detect missing IDs.
 *
 * @param {string[]}               statusIds
 * @param {PoolClient} client
 * @returns {Promise<{ id: string }[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const validateInventoryStatusIds = async (statusIds, client) => {
  const context = `${CONTEXT}/validateInventoryStatusIds`;

  const params = [statusIds];

  try {
    const { rows } = await query(
      VALIDATE_INVENTORY_STATUS_IDS_QUERY,
      params,
      client
    );
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to validate inventory status IDs.',
      meta: { statusCount: statusIds.length },
      logFn: (err) =>
        logDbQueryError(VALIDATE_INVENTORY_STATUS_IDS_QUERY, params, err, {
          context,
        }),
    });
  }
};

/**
 * Fetches a single inventory status record by ID.
 * Returns null if not found — caller is responsible for the not-found check.
 *
 * @param {string}                 statusId
 * @param {PoolClient} client
 * @returns {Promise<{ id: string }|null>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getInventoryStatusById = async (statusId, client) => {
  const context = `${CONTEXT}/getInventoryStatusById`;

  const params = [statusId];

  try {
    const { rows } = await query(
      GET_INVENTORY_STATUS_BY_ID_QUERY,
      params,
      client
    );
    return rows[0] || null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch inventory status by ID.',
      meta: { statusId },
      logFn: (err) =>
        logDbQueryError(GET_INVENTORY_STATUS_BY_ID_QUERY, params, err, {
          context,
        }),
    });
  }
};

/**
 * Fetches offset-paginated inventory statuses for dropdown/lookup use.
 *
 * Defaults:
 *  - sort: name ASC, with id ASC as a stable tie-breaker
 *  - limit: 50, offset: 0
 *
 * @param {GetPaginatedInventoryStatusLookupOptions} options
 * @returns {Promise<PaginatedOffsetResult<InventoryStatusLookupRow>>}
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getPaginatedInventoryStatusLookup = async ({
                                                   filters = {},
                                                   limit = 50,
                                                   offset = 0,
                                                 }) => {
  const context = `${CONTEXT}/getPaginatedInventoryStatusLookup`;
  const { whereClause, params } = buildInventoryStatusFilters(filters);
  const queryText = buildInventoryStatusLookupQuery(whereClause);
  
  try {
    return /** @type {PaginatedOffsetResult<InventoryStatusLookupRow>} */ (
      await paginateQueryByOffset({
        tableName: INVENTORY_STATUS_LOOKUP_TABLE,
        joins: INVENTORY_STATUS_LOOKUP_JOINS,
        whereClause,
        queryText,
        params,
        offset,
        limit,
        sortBy: 'ist.name',
        sortOrder: 'ASC',
        additionalSorts: INVENTORY_STATUS_LOOKUP_ADDITIONAL_SORTS,
        whitelistSet: INVENTORY_STATUS_LOOKUP_SORT_WHITELIST,
      })
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch inventory status lookup.',
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
  validateInventoryStatusIds,
  getInventoryStatusById,
  getPaginatedInventoryStatusLookup,
};
