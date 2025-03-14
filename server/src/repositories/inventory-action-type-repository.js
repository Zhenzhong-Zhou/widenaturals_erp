const { query, withTransaction, retry } = require('../database/db');
const {
  insertWarehouseLotAdjustment,
} = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Fetches the ID of an inventory action type by its name.
 *
 * @param {import('pg').PoolClient} client - The database transaction client.
 * @param {string} actionTypeName - The name of the inventory action type.
 * @returns {Promise<string>} - The ID of the inventory action type.
 * @throws {Error} - Throws an error if the action type is not found.
 */
const getActionTypeId = async (client, actionTypeName) => {
  if (!actionTypeName) {
    throw AppError.validationError('Action type name must be provided.');
  }

  try {
    return await retry(
      async () => {
        const queryText = `SELECT id FROM inventory_action_types WHERE name = $1 LIMIT 1;`;
        const params = [actionTypeName];

        const { rows } = client
          ? await client.query(queryText, params) // Use transaction client if available
          : await query(queryText, params); // Use default pool query otherwise

        if (!rows.length) {
          throw AppError.notFoundError(
            `Inventory action type "${actionTypeName}" not found.`
          );
        }

        return rows[0].id;
      },
      3,
      1000
    ); // Retries up to 3 times with exponential backoff
  } catch (error) {
    logError(`Error fetching action type ID for "${actionTypeName}":`, error);
    throw AppError.databaseError('Failed to fetch inventory action type.', {
      details: { actionTypeName, error: error.message },
    });
  }
};

module.exports = {
  getActionTypeId,
};
