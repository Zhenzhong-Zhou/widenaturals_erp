const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

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
      throw AppError.notFoundError(`Fulfillment status not found for code: ${statusCode}`);
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
    throw AppError.databaseError(`Failed to retrieve fulfillment status: ${error.message}`);
  }
};

module.exports = {
  getFulfillmentStatusByCode
};
