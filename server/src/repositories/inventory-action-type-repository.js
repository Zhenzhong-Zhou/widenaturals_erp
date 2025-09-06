const {  getUniqueScalarValue } = require('../database/db');

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
 * @param {import('pg').PoolClient} client - Active database client or transaction context.
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
        context: 'inventory-action-type-repository/getInventoryActionTypeId',
        actionTypeName,
      }
    );
  } catch (error) {
    // getUniqueScalarValue already throws with proper context and logs
    throw error;
  }
};

module.exports = {
  getInventoryActionTypeId,
};
