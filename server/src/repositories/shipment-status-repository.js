const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Fetches a shipment status row by its code.
 *
 * Business rules:
 *  - Shipment statuses represent lifecycle stages of an outbound shipment
 *    (e.g., PENDING, SHIPPED, DELIVERED).
 *  - A valid status code must map to exactly one row.
 *  - If no row is found, a NotFoundError is thrown.
 *
 * Usage:
 *  - Call before updating outbound shipment records to resolve the correct status ID.
 *  - Used in workflows such as marking a shipment as shipped or delivered.
 *
 * Performance:
 *  - O(1): Single-row lookup using indexed `code` column.
 *  - Uses `LIMIT 1` for efficiency.
 *
 * @async
 * @function
 * @param {string} statusCode - Shipment status code (e.g., "FULFILLMENT_SHIPPED")
 * @param {import('pg').PoolClient|null} [client=null] - Optional PostgreSQL client/transaction
 * @returns {Promise<{
 *   id: string,
 *   code: string,
 *   isFinal: boolean
 * }>} Shipment status metadata
 *
 * @throws {AppError.notFoundError} If no status is found for the given code
 * @throws {AppError.databaseError} If the query fails
 *
 * @example
 * const status = await getShipmentStatusByCode('FULFILLMENT_SHIPPED');
 * // {
 * //   id: "uuid-456",
 * //   code: "FULFILLMENT_SHIPPED",
 * //   isFinal: false
 * // }
 */
const getShipmentStatusByCode = async (statusCode, client = null) => {
  const sql = `
    SELECT id, code, is_final
    FROM shipment_status
    WHERE code = $1
    LIMIT 1
  `;
  
  try {
    const { rows } = await query(sql, [statusCode], client);
    const row = rows?.[0];
    
    if (!row) {
      throw AppError.notFoundError(`Shipment status not found for code: ${statusCode}`);
    }
    
    return {
      id: row.id,
      code: row.code,
      isFinal: row.is_final,
    };
  } catch (error) {
    logSystemException(error, 'Failed to get shipment status by code', {
      context: 'shipment-repository/getShipmentStatusByCode',
      statusCode,
    });
    throw AppError.databaseError(`Failed to retrieve shipment status: ${error.message}`);
  }
};

module.exports = {
  getShipmentStatusByCode,
};
