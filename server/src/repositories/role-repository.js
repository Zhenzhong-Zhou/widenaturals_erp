const { query } = require('../database/db');


/**
 * Fetches the ID of a role by its name or ID.
 *
 * @param {string} field - The field to search by ('name' or 'id').
 * @param {string} value - The value to search for (role name or ID).
 * @returns {Promise<uuid|null>} - The role ID if found, or null if not found.
 */
const getRoleIdByField = async (field, value) => {
  const validFields = ['name', 'id'];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid field: ${field}. Must be one of ${validFields.join(', ')}`);
  }
  
  const text = `
    SELECT id
    FROM roles
    WHERE ${field} = $1
    LIMIT 1;
  `;
  const params = [field === 'name' ? value.toLowerCase() : value];
  const result = await query(text, params);
  
  if (result.rows.length === 0) {
    return null; // Role not found
  }
  
  return result.rows[0].id;
};

module.exports = { getRoleIdByField };
