const { getUniqueScalarValue } = require('../database/db');

/**
 * Retrieves the payment status ID by its code.
 *
 * @param {string} code - The payment status code (e.g., 'UNPAID').
 * @param {PoolClient} [client=null] - Optional database client/transaction.
 * @returns {Promise<string|null>} - The status ID or null if not found.
 * @throws {AppError} - If the database query fails.
 */
const getPaymentStatusIdByCode = async (code, client = null) => {
  try {
    return await getUniqueScalarValue(
      {
        table: 'payment_status',
        where: { code },
        select: 'id',
      },
      client,
      {
        context: 'payment-status-repository/getPaymentStatusIdByCode',
        code,
      }
    );
  } catch (error) {
    throw error; // already logged by getUniqueScalarValue
  }
};

module.exports = {
  getPaymentStatusIdByCode,
};
