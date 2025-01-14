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
 * @throws {AppError} If the query fails.
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
 * @param {string} email - The user's email.
 * @returns {Promise<object>} - The user record with authentication details.
 * @throws {AppError} If the query fails or the user is not active.
 */
const getUserAuthByEmail = async (email) => {
  const text = `
    SELECT
      u.id AS user_id,
      u.email,
      u.role_id,
      ua.password_hash AS passwordHash,
      ua.password_salt AS passwordSalt,
      ua.failed_attempts,
      ua.lockout_time,
      ua.metadata
    FROM users u
    INNER JOIN user_auth ua ON u.id = ua.user_id
    INNER JOIN status s ON u.status_id = s.id
    WHERE u.email = $1 AND s.name = 'active';
  `;
  try {
    const result = await query(text, [email]);
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
 * @param {string} useId - The user's email.
 * @param {number} currentAttempts - The current number of failed attempts.
 * @returns {Promise<void>} Resolves when the update is successful.
 * @throws {AppError} If the query fails.
 */
const incrementFailedAttempts = async (useId, currentAttempts) => {
  const newAttempts = currentAttempts + 1;
  let lockoutTime = null;
  const metadataUpdates = {};
  
  if (newAttempts >= 5) {
    lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    metadataUpdates.lastLockout = lockoutTime;
    metadataUpdates.notes = 'Account locked due to multiple failed attempts.';
  }
  
  const text = `
    UPDATE user_auth
    SET
      failed_attempts = $1,
      lockout_time = $2,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'),
        '{lastLockout}',
        to_jsonb($3::timestamp),
        true
      ),
      updated_at = NOW()
    WHERE user_id = $4
  `;
  
  try {
    await query(text, [newAttempts, lockoutTime, lockoutTime, useId]);
  } catch (error) {
    logError(
      `Database error incrementing failed attempts for email ${useId}:`,
      error
    );
    throw AppError.databaseError('Failed to update failed attempts', {
      isExpected: false,
    });
  }
};

/**
 * Resets failed attempts and updates last login for a user.
 *
 * @async
 * @param {string} useId - The user's id.
 * @returns {Promise<void>} Resolves when the update is successful.
 * @throws {AppError} If the query fails.
 */
const resetFailedAttemptsAndUpdateLastLogin = async (useId) => {
  const text = `
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
      ),
      updated_at = NOW()
    WHERE user_id = $1
  `;
  
  try {
    await query(text, [useId]);
  } catch (error) {
    logError(
      `Database error resetting failed attempts and updating last login for email ${useId}:`,
      error
    );
    throw AppError.databaseError('Failed to reset failed attempts or update last login', {
      isExpected: false,
    });
  }
};

module.exports = {
  insertUserAuth,
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
};
