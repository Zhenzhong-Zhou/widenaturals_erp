const { getUniqueScalarValue, getFieldsById, query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Retrieves the order status ID by its code.
 *
 * @param {string} code - The status code (e.g., 'ORDER_PENDING').
 * @param {object} [client=null] - Optional database client/transaction.
 * @returns {Promise<UUID|null>} - The status ID or null if not found.
 * @throws {AppError} - If the database query fails.
 */
const getOrderStatusIdByCode = async (code, client = null) => {
  try {
    return await getUniqueScalarValue(
      {
        table: 'order_status',
        where: { code },
        select: 'id',
      },
      client,
      {
        context: 'order-status-repository/getOrderStatusIdByCode',
        code,
      }
    );
  } catch (error) {
    throw error; // already logged by getUniqueScalarValue
  }
};

/**
 * Retrieves an order status record by its code.
 *
 * This function queries the `order_status` table for the given status code,
 * returning its ID, code, and category if found.
 *
 * @param {string} statusCode - The status code to look up (e.g., 'ORDER_CONFIRMED').
 * @param {object} client - PostgreSQL client instance (usually from a transaction context).
 * @returns {Promise<{ id: string, code: string, category: string }>} - The matching order status record.
 *
 * @throws {AppError} - If no matching status is found or if a database error occurs.
 */
const getOrderStatusByCode = async (statusCode, client) => {
  const sql = `
    SELECT id, code, category
    FROM order_status
    WHERE code = $1
    LIMIT 1
  `;
  
  const values = [statusCode];
  
  try {
    const result = await query(sql, values, client);
    const row = result.rows?.[0];

    if (!row) {
      throw AppError.notFoundError(`Order status not found for code: ${statusCode}`);
    }

    return {
      id: row.id,
      code: row.code,
      category: row.category,
    };
  } catch (error) {
    logSystemException(error, 'Failed to get order status by code', {
      context: 'order-repository/getOrderStatusByCode',
      statusCode,
    });
    
    throw AppError.databaseError(`Failed to retrieve order status: ${error.message}`);
  }
};

/**
 * Fetches the order status metadata by its ID.
 *
 * Retrieves the `name`, `category`, and `code` fields from the `order_status` table
 * for a given status ID. This is typically used to resolve the full status metadata
 * of an order for display, logging, or validation purposes.
 *
 * @param {string} id - UUID of the order status.
 * @param {object} client - Optional PostgreSQL client for transaction context.
 * @returns {Promise<object>} - An object containing `name`, `category`, and `code`.
 *
 * @throws {AppError} - If the record is not found or query fails.
 */
const getOrderStatusMetadataById = async (id, client) => {
  return await getFieldsById('order_status', id, ['name', 'category', 'code'], client);
};

module.exports = {
  getOrderStatusIdByCode,
  getOrderStatusByCode,
  getOrderStatusMetadataById
};
