/**
 * @file inventory-action-type-repository.js
 * @description Database access layer for inventory action type records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from inventory-action-type-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getInventoryActionTypeLookup — offset-paginated lookup with optional filtering
 */

'use strict';

const { getUniqueScalarValue } = require('../utils/db/record-utils');
const {
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  buildInventoryActionTypeFilter,
} = require('../utils/sql/build-inventory-action-type-filter');
const {
  INVENTORY_ACTION_TYPE_TABLE,
  INVENTORY_ACTION_TYPE_SORT_WHITELIST,
  buildInventoryActionTypeLookupQuery,
} = require('./queries/inventory-action-type-queries');

const CONTEXT = 'inventory-action-type-repository';

/**
 * Retrieves the unique ID of an inventory action type by its exact name.
 *
 * This function queries the `inventory_action_types` table to fetch the UUID
 * associated with the given action type name (e.g., "reserve", "adjustment", "release").
 * It ensures the result is a single unique row and throws an error if:
 * - The action type is not found.
 * - Multiple entries exist for the given name (which would indicate a data integrity issue).
 *
 * Internally uses the `getUniqueScalarValue` utility for consistency and error logging.
 *
 * @async
 * @param {string} actionTypeName - Case-sensitive name of the inventory action type.
 * @param {PoolClient} client - Active database client or transaction context.
 * @returns {Promise<string>} - Resolved UUID string of the matching inventory action type.
 *
 * @throws {AppError} - If the action type does not exist or if a uniqueness violation occurs.
 *
 * @example
 * const actionTypeId = await getInventoryActionTypeId('reserve', client);
 */
const getInventoryActionTypeId = async (actionTypeName, client) => {
  try {
    return await getUniqueScalarValue(
      {
        table: 'inventory_action_types',
        where: { name: actionTypeName },
        select: 'id',
      },
      client,
      {
        context: `${CONTEXT}/getInventoryActionTypeId`,
        actionTypeName,
      }
    );
  } catch (error) {
    // getUniqueScalarValue already throws with proper context and logs
    throw error;
  }
};


// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated inventory action type records with optional filtering.
 *
 * Sorted by name ascending — intended for dropdown/selection use.
 *
 * Active-only enforcement is a business rule: the business layer should pass
 * `filters.statusId` (resolved via the status cache) when restricting to
 * active action types in user-facing lookups.
 *
 * @param {Object}  options
 * @param {Object}  [options.filters={}] - Optional filters (e.g. statusId, categories).
 * @param {number}  [options.limit=50]   - Max records per page.
 * @param {number}  [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getInventoryActionTypeLookup = async ({
                                              filters = {},
                                              limit = 50,
                                              offset = 0,
                                            }) => {
  const context = `${CONTEXT}/getInventoryActionTypeLookup`;
  
  const { whereClause, params } = buildInventoryActionTypeFilter(filters);
  const queryText = buildInventoryActionTypeLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName: INVENTORY_ACTION_TYPE_TABLE,
      joins: [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'iat.name',
      sortOrder: 'ASC',
      whitelistSet: INVENTORY_ACTION_TYPE_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch inventory action type lookup.',
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
  getInventoryActionTypeId,
  getInventoryActionTypeLookup,
};
