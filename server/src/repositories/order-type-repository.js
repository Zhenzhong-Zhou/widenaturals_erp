const { query } = require('../database/db');
const AppError = require('../utils/AppError'); // Import the reusable query function

/**
 * Fetches an order type by ID or Name.
 * @param {Object} params - The parameters (id or name).
 * @param {string} [params.id] - The UUID of the order type.
 * @param {string} [params.name] - The name of the order type.
 * @returns {Promise<Object|null>} - Returns the order type object or null if not found.
 */
const getOrderTypeByIdOrName = async ({ id, name }) => {
  let sql;
  let values;
  
  if (id) {
    sql = `SELECT * FROM order_types WHERE id = $1 LIMIT 1;`;
    values = [id];
  } else if (name) {
    sql = `SELECT * FROM order_types WHERE name = $1 LIMIT 1;`;
    values = [name];
  } else {
    throw AppError.databaseError('Either "id" or "name" must be provided to fetch an order type.');
  }
  
  const result = await query(sql, values);
  return result.rows[0] || null;
};

module.exports = { getOrderTypeByIdOrName };
