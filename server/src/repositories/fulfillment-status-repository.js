const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Fetches a fulfillment status row by its code.
 *
 * Business rules:
 *  - A valid fulfillment status code must resolve to exactly one row.
 *  - If no row is found, throws a NotFoundError.
 *  - Used to enforce business workflow transitions (e.g., PENDING → PICKING).
 *
 * Usage:
 *  - Call before updating fulfillment records to resolve the correct status ID.
 *  - Can also be used to fetch metadata such as sort order and category.
 *
 * Performance:
 *  - O(1): Single-row lookup with indexed `code` column (expected).
 *  - Uses `LIMIT 1` for efficiency.
 *
 * @async
 * @function
 * @param {string} statusCode - Fulfillment status code (e.g., "FULFILLMENT_PICKING")
 * @param {import('pg').PoolClient|null} [client=null] - Optional PostgreSQL client/transaction
 * @returns {Promise<{
 *   id: string,
 *   code: string,
 *   sortOrder: number,
 *   category: string,
 *   isDefault: boolean
 * }>} Fulfillment status metadata
 *
 * @throws {AppError.notFoundError} If no status is found for the given code
 * @throws {AppError.databaseError} If the query fails
 *
 * @example
 * const status = await getFulfillmentStatusByCode('FULFILLMENT_PICKING');
 * // {
 * //   id: "uuid-123",
 * //   code: "FULFILLMENT_PICKING",
 * //   sortOrder: 2,
 * //   category: "internal",
 * //   isDefault: false
 * // }
 */
const getFulfillmentStatusByCode = async (statusCode, client = null) => {
  const sql = `
    SELECT id, code, sort_order, category, is_default
    FROM fulfillment_status
    WHERE code = $1
    LIMIT 1
  `;

  try {
    const { rows } = await query(sql, [statusCode], client);
    const row = rows?.[0];

    if (!row) {
      throw AppError.notFoundError(
        `Fulfillment status not found for code: ${statusCode}`
      );
    }

    return {
      id: row.id,
      code: row.code,
      sortOrder: row.sort_order,
      category: row.category,
      isDefault: row.is_default,
    };
  } catch (error) {
    logSystemException(error, 'Failed to get fulfillment status by code', {
      context: 'fulfillment-repository/getFulfillmentStatusByCode',
      statusCode,
    });
    throw AppError.databaseError(
      `Failed to retrieve fulfillment status: ${error.message}`
    );
  }
};

/**
 * Repository: getFulfillmentStatusesByIds
 *
 * Fetch fulfillment status metadata (ID, code, name) for one or more status IDs.
 *
 * This function is primarily used during fulfillment confirmation and validation
 * workflows to resolve the human-readable and code-based status metadata.
 *
 * ---
 * Features:
 *  - Accepts an array of UUIDs and returns all matching status records.
 *  - Uses `ANY($1::uuid[])` for efficient batched lookup in PostgreSQL.
 *  - Applies `DISTINCT` defensively to prevent accidental duplicates
 *    if multiple rows share identical `code` or `name` values.
 *  - Returns an empty array safely if no matches or invalid input.
 *
 * ---
 * Performance Notes:
 *  - This query is extremely lightweight since `fulfillment_status`
 *    is a static lookup table (dozens of rows at most).
 *  - The `DISTINCT` adds negligible cost but ensures deduplication.
 *  - An index on `id` (primary key) ensures near O(1) lookups.
 *
 * ---
 * @example
 * const statuses = await getFulfillmentStatusesByIds(
 *   ['bde1de96-856d-47eb-bd92-1217c26fba8b', '7f89157b-8e90-4d6f-b41c-230b7a93ef52'],
 *   client
 * );
 * // → [ { id: '...', code: 'FULFILLMENT_PENDING', name: 'Pending' }, ... ]
 *
 * ---
 * @param {string[]} statusIds - Array of fulfillment status UUIDs
 * @param {object|null} client - Optional DB client (transaction context)
 * @returns {Promise<Array<{ id: string, code: string, name: string }>>}
 *
 * @throws {AppError.DatabaseError}
 *  - If the database query fails
 */
const getFulfillmentStatusesByIds = async (statusIds, client = null) => {
  // Early exit: avoid unnecessary query if input is empty
  if (!Array.isArray(statusIds) || statusIds.length === 0) {
    logSystemInfo('Skipped fulfillment status lookup: no status IDs provided', {
      context: 'outbound-fulfillment-repository/getFulfillmentStatusesByIds',
    });
    return [];
  }

  const sql = `
    SELECT DISTINCT id, code, name
    FROM fulfillment_status
    WHERE id = ANY($1::uuid[])
  `;

  try {
    const result = await query(sql, [statusIds], client);

    logSystemInfo('Fetched fulfillment status metadata successfully', {
      context: 'outbound-fulfillment-repository/getFulfillmentStatusesByIds',
      rowCount: result.rowCount ?? result.rows?.length ?? 0,
      statusIdsCount: statusIds.length,
    });

    return result.rows ?? [];
  } catch (error) {
    logSystemException(error, 'Failed to fetch fulfillment statuses by IDs', {
      context: 'outbound-fulfillment-repository/getFulfillmentStatusesByIds',
      statusIds,
    });

    throw AppError.databaseError(
      'Unable to fetch fulfillment status metadata.',
      {
        cause: error,
        statusIds,
        context: 'outbound-fulfillment-repository/getFulfillmentStatusesByIds',
      }
    );
  }
};

module.exports = {
  getFulfillmentStatusByCode,
  getFulfillmentStatusesByIds,
};
