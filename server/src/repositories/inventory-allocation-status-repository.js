const { getUniqueScalarValue, query } = require('../database/db');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieves the unique ID of an inventory allocation status by its exact code.
 *
 * This function queries the `status` table (or your status mapping table, if separated)
 * to fetch the UUID associated with the given status code (e.g., "ALLOCATION_CONFIRMED").
 * It ensures that:
 * - Exactly one row matches the given code.
 * - If no rows or multiple rows are found, it throws a detailed error.
 *
 * Uses `getUniqueScalarValue` to ensure consistency and traceability.
 *
 * @async
 * @param {string} statusCode - Case-sensitive status code to lookup.
 * @param {import('pg').PoolClient} client - Active PostgreSQL client or transaction context.
 * @returns {Promise<string>} - UUID of the matching allocation status.
 *
 * @throws {AppError} - Throws if the status is not found or not unique.
 *
 * @example
 * const confirmedStatusId = await getInventoryAllocationStatusId('ALLOCATION_CONFIRMED', client);
 */
const getInventoryAllocationStatusId = async (statusCode, client) => {
  try {
    return await getUniqueScalarValue(
      {
        table: 'inventory_allocation_status',
        where: { code: statusCode },
        select: 'id',
      },
      client,
      {
        context:
          'inventory-allocation-status-repository/getInventoryAllocationStatusId',
        statusCode,
      }
    );
  } catch (error) {
    // getUniqueScalarValue already logs and throws with traceable context
    throw error;
  }
};

/**
 * Repository: Get Inventory Allocation Statuses by Codes
 *
 * Retrieves allocation status records by their unique status codes.
 *
 * This helper is typically used in:
 *   - Business rule enforcement (e.g. operational dependency checks)
 *   - Status transition validation
 *   - Filtering allocation records by lifecycle stage
 *
 * ─────────────────────────────────────────────────────────────
 * Behavior
 * ─────────────────────────────────────────────────────────────
 * - Accepts an array of status code strings.
 * - Returns matching status rows from `inventory_allocation_status`.
 * - If `statusCodes` is empty or invalid, returns an empty array.
 * - Uses parameterized SQL to prevent injection.
 *
 * ─────────────────────────────────────────────────────────────
 * Example Usage
 * ─────────────────────────────────────────────────────────────
 * const ACTIVE_ALLOCATION_CODES = [
 *   'ALLOC_PENDING',
 *   'ALLOC_CONFIRMED',
 *   'ALLOC_PARTIAL'
 * ];
 *
 * const statuses = await getInventoryAllocationStatusesByCodes(
 *   ACTIVE_ALLOCATION_CODES,
 *   client
 * );
 *
 * ─────────────────────────────────────────────────────────────
 * @param {string[]} statusCodes
 *   Array of allocation status codes (e.g. ['ALLOC_PENDING']).
 *
 * @param {import('pg').PoolClient} client
 *   Active PostgreSQL transaction client.
 *
 * @returns {Promise<Array<{ id: string, code: string }>>}
 *   Array of matching status records.
 *
 * @throws {AppError}
 *   Throws databaseError if query execution fails.
 */
const getInventoryAllocationStatusesByCodes = async (
  statusCodes,
  client
) => {
  const context =
    'inventory-allocation-status-repository/getInventoryAllocationStatusesByCodes';
  
  if (!Array.isArray(statusCodes) || statusCodes.length === 0) {
    return [];
  }
  
  const sql = `
    SELECT id, code
    FROM inventory_allocation_status
    WHERE code = ANY($1)
  `;
  
  try {
    const result = await query(sql, [statusCodes], client);
    return result.rows;
  } catch (error) {
    logSystemException(
      error,
      'Failed to get inventory allocation statuses by codes',
      {
        context,
        statusCodes,
      }
    );
    
    throw AppError.databaseError(
      `Failed to retrieve allocation statuses: ${error.message}`
    );
  }
};

module.exports = {
  getInventoryAllocationStatusId,
  getInventoryAllocationStatusesByCodes,
};
