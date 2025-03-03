const { query, retry } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError'); // Import the query function

/**
 * Fetch warehouse lot status ID by name OR name by ID.
 * @param {Object} client - The database client (optional, for transactions).
 * @param {Object} options - The lookup options ({ id: 'uuid' } or { name: 'status_name' }).
 * @returns {Promise<{ id: string, name: string } | null>} - The warehouse lot status (ID & name) or null if not found.
 */
const getWarehouseLotStatus = async (client, options) => {
  if (!options.id && !options.name) {
    throw new AppError('Either "id" or "name" must be provided.');
  }
  
  const queryText = options.id
    ? `SELECT id, name FROM warehouse_lot_status WHERE id = $1 LIMIT 1;`
    : `SELECT id, name FROM warehouse_lot_status WHERE name = $1 LIMIT 1;`;
  
  const values = [options.id || options.name];
  
  return await retry(async () => {
    try {
      const { rows } = client
        ? await client.query(queryText, values) // Use transaction client if available
        : await query(queryText, values); // Use normal pool query
      
      return rows.length ? rows[0] : null; // Return { id, name } or null if not found
    } catch (error) {
      logError(`Error fetching warehouse lot status: ${JSON.stringify(options)}`, error);
      throw new AppError(`Failed to fetch warehouse lot status.`);
    }
  }, 3, 1000); // Retry 3 times with exponential backoff
};

module.exports = { getWarehouseLotStatus };
