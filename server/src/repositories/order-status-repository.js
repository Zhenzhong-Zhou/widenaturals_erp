const { getUniqueScalarValue } = require('../database/db');

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

module.exports = {
  getOrderStatusIdByCode,
};
