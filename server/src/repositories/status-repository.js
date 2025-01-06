const { query } = require('../database/db');

/**
 * Fetches the ID of a status by its name.
 *
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid|null>} - The status ID or null if not found.
 */
const getStatusIdByName = async (statusName) => {
  const text = `
    SELECT id
    FROM status
    WHERE LOWER(name) = LOWER($1) -- Case-insensitive match
    LIMIT 1;
  `;
  const params = [statusName];
  const result = await query(text, params);
  
  if (result.rows.length === 0) {
    return null; // Status not found
  }
  
  return result.rows[0].id;
};

module.exports = { getStatusIdByName };
