const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper'); // Import the reusable query function

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

/**
 * Fetch all order types from the database using raw SQL.
 * @returns {Promise<Array>} List of order types.
 */
const getAllOrderTypes = async () => {
  try {
    const queryText = `
      SELECT
        ot.id,
        ot.name,
        ot.category,
        ot.description,
        s.name AS status_name,
        ot.status_date,
        ot.created_at,
        ot.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
      FROM order_types ot
      INNER JOIN status s ON ot.status_id = s.id
      LEFT JOIN users u1 ON ot.created_by = u1.id
      LEFT JOIN users u2 ON ot.updated_by = u2.id
      ORDER BY ot.name ASC;
    `;
    
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching order types:', error);
    throw AppError.databaseError('Failed to fetch order types');
  }
};

module.exports = {
  getOrderTypeByIdOrName,
  getAllOrderTypes,
};
