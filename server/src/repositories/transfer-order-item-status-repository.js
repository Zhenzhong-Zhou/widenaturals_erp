const { query } = require('../database/db');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Repository: Get Transfer Order Item Statuses by Codes
 *
 * Retrieves transfer order item status records by their unique status codes.
 *
 * This helper is primarily used in:
 *   - Business rule enforcement for transfer operations
 *   - Operational dependency checks
 *   - Lifecycle validation for transfer items
 *
 * ─────────────────────────────────────────────────────────────
 * Behavior
 * ─────────────────────────────────────────────────────────────
 * - Accepts an array of status code strings.
 * - Returns matching rows from `transfer_order_item_status`.
 * - Returns an empty array if input is invalid or empty.
 * - Uses PostgreSQL `ANY($1)` for safe array binding.
 *
 * ─────────────────────────────────────────────────────────────
 * Example
 * ─────────────────────────────────────────────────────────────
 * const ACTIVE_TRANSFER_CODES = [
 *   'TRANSFER_ITEM_PENDING',
 *   'TRANSFER_ITEM_ALLOCATED'
 * ];
 *
 * const statuses = await getTransferItemStatusesByCodes(
 *   ACTIVE_TRANSFER_CODES,
 *   client
 * );
 *
 * ─────────────────────────────────────────────────────────────
 * @param {string[]} statusCodes
 *   Array of transfer item status codes.
 *
 * @param {import('pg').PoolClient} client
 *   Active PostgreSQL transaction client.
 *
 * @returns {Promise<Array<{ id: string, code: string }>>}
 *   Array of matching status records.
 *
 * @throws {AppError}
 *   Throws databaseError if the query fails.
 */
const getTransferItemStatusesByCodes = async (
  statusCodes,
  client
) => {
  const context =
    'transfer-order-item-status-repository/getTransferItemStatusesByCodes';
  
  if (!Array.isArray(statusCodes) || statusCodes.length === 0) {
    return [];
  }
  
  const sql = `
    SELECT id, code
    FROM transfer_order_item_status
    WHERE code = ANY($1)
  `;
  
  try {
    const result = await query(sql, [statusCodes], client);
    return result.rows;
  } catch (error) {
    logSystemException(
      error,
      'Failed to get transfer item statuses by codes',
      {
        context,
        statusCodes,
      }
    );
    
    throw AppError.databaseError(
      `Failed to retrieve transfer item statuses: ${error.message}`
    );
  }
};

module.exports = {
  getTransferItemStatusesByCodes,
};
