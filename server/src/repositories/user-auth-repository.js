const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');

/**
 * Inserts authentication details into the `user_auth` table.
 *
 * @async
 * @function
 * @param {object} client - The database client used for executing queries.
 * @param {object} authDetails - Authentication details.
 * @param {uuid} authDetails.userId - The user ID.
 * @param {string} authDetails.passwordHash - The hashed password.
 * @param {string} authDetails.passwordSalt - The salt used for hashing the password.
 * @returns {Promise<void>} Resolves when the insertion is successful.
 * @throws {Error} If the query fails.
 */
const insertUserAuth = async (client, { userId, passwordHash, passwordSalt }) => {
  const sql = `
    INSERT INTO user_auth (
      user_id, password_hash, password_salt, created_at
    )
    VALUES ($1, $2, $3, $4);
  `;
  const params = [userId, passwordHash, passwordSalt, new Date()];
  
  await client.query(sql, params);
};

/**
 * Fetches a user's authentication details by email.
 *
 * @param {string} email - The user's email.
 * @returns {Promise<object>} - The user record with authentication details.
 */
const getUserAuthByEmail = async (email) => {
  const text = `
    SELECT
      u.id,
      u.email,
      ua.password_hash AS passwordHash,
      ua.password_salt AS passwordSalt,
      r.name AS roleName
    FROM users u
    INNER JOIN user_auth ua ON u.id = ua.user_id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN status s ON u.status_id = s.id
    WHERE u.email = $1
      AND s.name = 'active';
  `;
  const params = [email];
  
  try {
    const result = await query(text, params);
    
    if (result.rows.length === 0) {
      logError(`User not found for email: ${email}`); // Log user not found
      return null; // Return null if user is not found
    }
    
    return result.rows[0];
  } catch (error) {
    logError(`Error fetching user authentication details: ${error.message}`); // Log query error
    throw new Error('Failed to fetch user authentication details');
  }
};

module.exports = { insertUserAuth, getUserAuthByEmail };
