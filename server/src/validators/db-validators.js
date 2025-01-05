const pool = require('../database/db');

/**
 * Check if an email exists in the database
 * @param {string} email - Email to validate
 * @returns {Promise<boolean>} - True if email exists, otherwise false
 */
const emailExists = async (email) => {
  const result = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  return result.rowCount > 0;
};

/**
 * Check if a role ID is valid
 * @param {string} roleId - Role ID to validate
 * @returns {Promise<boolean>} - True if role exists, otherwise false
 */
const roleExists = async (roleId) => {
  const result = await pool.query('SELECT 1 FROM roles WHERE id = $1', [roleId]);
  return result.rowCount > 0;
};

module.exports = {
  emailExists,
  roleExists,
};
