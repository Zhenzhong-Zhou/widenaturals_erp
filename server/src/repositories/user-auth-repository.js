const AppError = require('../utils/AppError');
const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const { verifyPassword } = require('../utils/password-helper');
const { validateUserExists } = require('../validators/db-validators');

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
 * Fetches a limited password history for a user, ordered by the most recent entry.
 *
 * This function retrieves the `password_history` from the `metadata` column of the `user_auth` table,
 * ensuring only the latest entries (e.g., limited to 4 or 5) are returned.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The unique identifier of the user whose password history is being retrieved.
 * @returns {Promise<Array<object>>} - Resolves to an array of password history objects containing keys like
 *                                     `password_hash`, `password_salt`, and `timestamp`.
 * @throws {AppError} - Throws a structured `AppError` if the query fails or an unexpected error occurs.
 */
const fetchPasswordHistory = async (client, userId) => {
  const sql = `
    SELECT jsonb_agg(value) AS limited_history
    FROM (
      SELECT value
      FROM jsonb_array_elements(
        COALESCE(
          (SELECT metadata->'password_history' FROM user_auth WHERE user_id = $1),
          '[]'::jsonb
        )
      ) AS value
      ORDER BY value->>'timestamp' DESC
      LIMIT 4
    ) sub;
  `;
  
  try {
    // const result = await query(sql, [userId]);
    const result = await client.query(sql, [userId]);
    
    // Return the limited history or an empty array if none exists
    return result.rows[0]?.limited_history || [];
  } catch (error) {
    logError('Error fetching password history:', error);
    
    // Throw a structured AppError for better error handling
    throw new AppError('Failed to fetch password history', 500, {
      type: 'DatabaseError',
    });
  }
};

/**
 * Verifies if the provided plain-text password matches the current password
 * stored in the database for a given user.
 *
 * This function retrieves the user's current password hash and salt from the database,
 * then uses a secure hashing algorithm to validate the provided plain-text password.
 *
 * @param {string} userId - The ID of the user whose password is being verified.
 * @param {string} plainPassword - The plain-text password to verify.
 * @returns {Promise<boolean>} - True if the password matches, false otherwise.
 * @throws {AppError} - Throws an error if the user is not found or if there is
 *                      an issue querying the database.
 */
const verifyCurrentPassword = async (userId, plainPassword) => {
  const sql = `
    SELECT password_hash, password_salt
    FROM user_auth
    WHERE user_id = $1
  `;
  
  try {
    // Fetch the current password hash and salt from the database
    const result = await query(sql, [userId]);
    
    const { password_hash: passwordHash, password_salt: passwordSalt } = result.rows[0];
    
    // Verify the plain-text password against the stored hash and salt
    const isMatch = await verifyPassword(plainPassword, passwordHash, passwordSalt);
    
    // Return whether the passwords match
    return isMatch;
  } catch (error) {
    // Log the error and throw a structured AppError for better error handling
    logError('Error verifying current password:', error);
    throw new AppError('Failed to verify current password', 500, {
      type: 'DatabaseError',
    });
  }
};

/**
 * Checks if a given password has been reused by the user.
 *
 * This function retrieves the user's password history from the `user_auth` table and compares
 * the new plain-text password against each stored hash in the history to ensure it has not been reused.
 * It is intended to be used within a transaction for atomicity.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The unique identifier of the user whose password is being validated.
 * @param {string} newPassword - The plain-text password to check against the user's password history.
 * @returns {Promise<boolean>} - Resolves to `true` if the password has been reused, otherwise `false`.
 * @throws {AppError} - Throws a structured `AppError` if a database or validation error occurs.
 */
const isPasswordReused = async (client, userId, newPassword) => {
  const passwordHistory = await fetchPasswordHistory(client, userId);
  
  try {
    // Compare the provided plain-text password with each stored hash
    for (const historyEntry of passwordHistory) {
      const { password_hash, password_salt } = historyEntry;
      const isMatch = await verifyPassword(newPassword, password_hash, password_salt);
      
      if (isMatch) {
        return true; // Password matches a previously used password
      }
    }
    
    return false; // No match found
  } catch (error) {
    // Log the error and throw a structured AppError for better error handling
    logError('Error checking password reuse:', error);
    throw new AppError('Failed to check password reuse', 500, {
      type: 'DatabaseError',
    });
  }
};

/**
 * Updates the password history for a user in the `user_auth` table.
 *
 * This function updates the `password_history` array stored in the `metadata` column
 * for the specified user. It is designed to be used within a transaction for atomic updates.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The unique identifier of the user whose password history is being updated.
 * @param {object[]} updatedHistory - An array of password history entries, each containing:
 *   - `password_hash`: The hashed password (string).
 *   - `password_salt`: The salt used for hashing the password (string).
 *   - `timestamp`: The timestamp when the password was set (string).
 *   Example: [{ password_hash: '...', password_salt: '...', timestamp: '...' }]
 * @returns {Promise<boolean>} - Resolves to `true` if the update was successful, otherwise `false`.
 * @throws {AppError} - Throws a structured `AppError` if the update fails.
 */
const updatePasswordHistory = async (client, userId, updatedHistory) => {
  const sql = `
    UPDATE user_auth
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{password_history}',
      $1::jsonb
    )
    WHERE user_id = $2
  `;
  
  try {
    const result = await query(sql, [JSON.stringify(updatedHistory), userId], client);
    return result.rowCount > 0;
  } catch (error) {
    logError('Error updating password history:', error);
    throw new AppError('Failed to update password history', 500, {
      type: 'DatabaseError',
    });
  }
};

/**
 * Updates the user's password hash and salt in the `user_auth` table.
 *
 * This function is part of the repository layer and updates the user's `password_hash`
 * and `password_salt` fields to reflect the new password. It is designed to be used
 * within a transaction for atomicity.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The unique identifier of the user whose password is being updated.
 * @param {string} hashedPassword - The newly hashed password to store.
 * @param {string} passwordSalt - The salt used to hash the new password.
 * @returns {Promise<boolean>} - Resolves to `true` if the update was successful, otherwise `false`.
 * @throws {AppError} - Throws a structured `AppError` if the update fails.
 */
const updatePasswordHashAndSalt = async (client, userId, hashedPassword, passwordSalt) => {
  const sql = `
    UPDATE user_auth
    SET
      password_hash = $1,
      password_salt = $2,
      updated_at = NOW()
    WHERE user_id = $3
  `;
  
  try {
    const result = await query(sql, [hashedPassword, passwordSalt, userId], client);
    return result.rowCount > 0;
  } catch (error) {
    logError('Error updating password hash and salt:', error);
    throw new AppError('Failed to update password hash and salt', 500, {
      type: 'DatabaseError',
    });
  }
};

module.exports = {
  insertUserAuth,
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
  verifyCurrentPassword,
  isPasswordReused,
  fetchPasswordHistory,
  updatePasswordHistory,
  updatePasswordHashAndSalt,
};
