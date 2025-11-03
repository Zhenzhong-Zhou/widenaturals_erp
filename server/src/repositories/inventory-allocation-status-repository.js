const { getUniqueScalarValue } = require('../database/db');

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

module.exports = {
  getInventoryAllocationStatusId,
};
