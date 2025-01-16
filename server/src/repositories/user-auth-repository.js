const AppError = require('../utils/AppError');
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
 * @throws {AppError} If the query fails due to a database error.
 */
const insertUserAuth = async (client, { userId, passwordHash, passwordSalt }) => {
  const sql = `
    INSERT INTO user_auth (user_id, password_hash, password_salt, created_at)
    VALUES ($1, $2, $3, $4);
  `;
  const params = [userId, passwordHash, passwordSalt, new Date()];
  
  try {
    await client.query(sql, params);
  } catch (error) {
    logError(`Database error inserting user auth for user ID ${userId}:`, error);
    throw AppError.databaseError('Failed to insert user authentication details', {
      isExpected: false,
    });
  }
};

/**
 * Fetches a user's authentication details by email.
 *
 * @async
 * @param {string} email - The user's email.
 * @returns {Promise<object>} - The user record with authentication details.
 * @throws {AppError} If the query fails or the user is not active.
 */
const getUserAuthByEmail = async (email) => {
  const sql = `
    SELECT
      u.id AS user_id,
      u.email,
      u.role_id,
      ua.password_hash AS passwordHash,
      ua.password_salt AS passwordSalt,
      ua.last_login,
      ua.failed_attempts,
      ua.lockout_time
    FROM users u
    INNER JOIN user_auth ua ON u.id = ua.user_id
    INNER JOIN status s ON u.status_id = s.id
    WHERE u.email = $1 AND s.name = 'active';
  `;
  try {
    const result = await query(sql, [email]);
    if (result.rows.length === 0) {
      throw AppError.notFoundError('User not found or inactive', {
        isExpected: true,
      });
    }
    return result.rows[0];
  } catch (error) {
    logError(`Error fetching user auth for email ${email}:`, error);
    throw AppError.databaseError('Failed to fetch user authentication details', {
      isExpected: false,
    });
  }
};

/**
 * Increments failed login attempts for a user.
 *
 * @async
 * @param {uuid} userId - The user's ID.
 * @param {number} currentAttempts - The current number of failed attempts.
 * @returns {Promise<void>} Resolves when the update is successful.
 * @throws {AppError} If the query fails due to a database error.
 */
const incrementFailedAttempts = async (userId, currentAttempts) => {
  const newAttempts = currentAttempts + 1;
  let lockoutTime = null;
  let notes = null;
  const metadataUpdates = {};
  
  if (newAttempts >= 5) {
    lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    metadataUpdates.lastLockout = lockoutTime;
    notes = 'Account locked due to multiple failed attempts.';
    metadataUpdates.notes = notes
  }
  
  const sql = `
    UPDATE user_auth
    SET
      failed_attempts = $1,
      lockout_time = $2,
      metadata = jsonb_set(
        jsonb_set(
          COALESCE(metadata, '{}'),
          '{lastLockout}',
          to_jsonb($3::timestamp),
          true
        ),
        '{notes}',
        to_jsonb($4::text),
        true
      ),
      updated_at = NOW()
    WHERE user_id = $5;
  `;
  
  try {
    await query(sql, [newAttempts, lockoutTime, lockoutTime, notes, userId]);
  } catch (error) {
    logError(`Database error incrementing failed attempts for user ID ${userId}:`, error);
    throw AppError.accountLockedError('Failed to update failed attempts', {
      isExpected: false,
    });
  }
};

/**
 * Resets failed attempts and updates the last login for a user.
 *
 * @async
 * @param {string} userId - The user's ID.
 * @returns {Promise<void>} Resolves when the update is successful.
 * @throws {AppError} If the query fails.
 */
const resetFailedAttemptsAndUpdateLastLogin = async (userId) => {
  const sql = `
    UPDATE user_auth
    SET
      failed_attempts = 0,
      lockout_time = NULL,
      last_login = NOW(),
       metadata = jsonb_set(
          COALESCE(metadata, '{}'),
          '{lastSuccessfulLogin}',
          to_jsonb(NOW()::timestamp),
          true
      ) || metadata,
      updated_at = NOW()
    WHERE user_id = $1
  `;
  
  try {
    await query(sql, [userId]);
  } catch (error) {
    logError(`Database error resetting failed attempts and updating last login for user ID ${userId}:`, error);
    throw AppError.databaseError('Failed to reset failed attempts or update last login', {
      isExpected: false,
    });
  }
};

/**
 * Checks if a given password has been used by the user in the past.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} hashedPassword - The hashed password to check.
 * @returns {Promise<boolean>} - True if the password is reused, false otherwise.
 * @throws {AppError} - Throws an error if the query fails.
 */
const isPasswordReused = async (userId, hashedPassword) => {
  const sql = `
    SELECT 1
    FROM user_auth
    WHERE user_id = $1
      AND $2 = ANY(
        ARRAY(
          SELECT jsonb_array_elements_text(metadata->'password_history')
        )
      )
  `;
  
  try {
    // Execute the query to check if the hashed password exists in the password history
    const result = await query(sql, [userId, hashedPassword]);
    
    // Return true if the password is reused, otherwise false
    return result.rowCount > 0;
  } catch (error) {
    // Log the error and throw a structured AppError for better error handling
    logError('Error checking password reuse:', error);
    throw new AppError('Failed to check password reuse', 500, {
      type: 'DatabaseError',
    });
  }
};

/**
 * Updates a user's password in the database and appends the old password to the history.
 *
 * @param {string} userId - The ID of the user whose password is being updated.
 * @param {string} hashedPassword - The new hashed password.
 * @param {string} passwordSalt - The salt used for hashing the password.
 * @returns {Promise<boolean>} - True if the update was successful, false otherwise.
 * @throws {AppError} - Throws an error if the update fails or the user is not found.
 */
const updatePasswordById = async (userId, hashedPassword, passwordSalt) => {
  const sql = `
    WITH password_history AS (
      SELECT jsonb_agg(value) AS limited_history
      FROM (
        SELECT jsonb_array_elements_text(metadata->'password_history') AS value
        FROM user_auth
        WHERE user_id = $3
        LIMIT 4
      ) sub
    )
    UPDATE user_auth
    SET
      password_hash = $1,
      password_salt = $2,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'),
        '{password_history}',
        COALESCE((SELECT limited_history FROM password_history), '[]'::jsonb) || to_jsonb($1::text)
      ),
      updated_at = NOW()
    WHERE user_id = $3;
  `;
  
  try {
    // Execute the query to update the user's password
    const result = await query(sql, [hashedPassword, passwordSalt, userId]);
    
    // Throw an error if no rows were updated (user not found or update failed)
    if (result.rowCount === 0) {
      throw new AppError('User not found or password update failed', 404, {
        type: 'NotFoundError',
        isExpected: true,
      });
    }
    
    // Return true if the update was successful
    return result.rowCount > 0;
  } catch (error) {
    // Log the error and throw a structured AppError for better error handling
    logError('Error updating user password:', error);
    throw new AppError('Failed to update password', 500, {
      type: 'DatabaseError',
    });
  }
};

module.exports = {
  insertUserAuth,
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
  isPasswordReused,
  updatePasswordById
};
