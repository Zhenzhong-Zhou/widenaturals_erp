const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError'); // Import the query function

/**
 * Fetch the ID of a warehouse lot status by name.
 * @param {Object} client - The database client (optional, for transactions).
 * @param {string} statusName - The name of the warehouse lot status (e.g., 'out_of_stock', 'in_stock').
 * @returns {Promise<string|null>} - The status ID or null if not found.
 */
const getWarehouseLotStatusId = async (client, statusName) => {
  const text = `SELECT id FROM warehouse_lot_status WHERE name = $1 LIMIT 1;`;
  const values = [statusName];
  
  try {
    const { rows } = client
      ? await client.query(text, values) // Use transaction client if available
      : await query(text, values); // Use normal pool query
    
    return rows[0]?.id || null; // Return status ID or null if not found
  } catch (error) {
    logError(`Error fetching warehouse lot status for ${statusName}:`, error);
    throw AppError(`Failed to fetch warehouse lot status: ${statusName}`);
  }
};

module.exports = { getWarehouseLotStatusId };
