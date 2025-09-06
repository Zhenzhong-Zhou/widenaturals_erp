const AppError = require('../utils/AppError');
const { query, retry, lockRow } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const { verifyPassword } = require('../utils/password-helper');

/**
 * Inserts authentication details into the `user_auth` table with retry and optional row locking.
 *
 * @async
 * @function
 * @param {object} client - The database client used for executing queries.
 * @param {object} authDetails - Authentication details.
 * @param {string} authDetails.userId - The user ID.
 * @param {string} authDetails.passwordHash - The hashed password.
 * @param {string} authDetails.passwordSalt - The salt used for hashing the password.
 * @returns {Promise<void>} Resolves when the insertion is successful.
 * @throws {AppError} If the query fails due to a database error or row locking issues.
 */
const insertUserAuth = async (
  client,
  { userId, passwordHash, passwordSalt }
) => {
  const sql = `
    INSERT INTO user_auth (user_id, password_hash, password_salt)
    VALUES ($1, $2, $3);
  `;
  const params = [userId, passwordHash, passwordSalt];

  try {
    // Lock the row in the `users` table to ensure consistency
    await lockRow(client, 'users', userId, 'FOR UPDATE');

    // Perform the insertion
    await query(sql, params, client);
  } catch (error) {
    logError(
      `Database error inserting user auth for user ID ${userId}:`,
      error
    );
    throw AppError.databaseError(
      'Failed to insert user authentication details'
    );
  }
};

/**
 * Fetches the primary key (id) from the user_auth table using the user_id.
 *
 * @async
 * @param {object} client - The database client used for the query.
 * @param {string} userId - The user_id to search for.
 * @returns {Promise<string>} - Resolves with the id from the user_auth table.
 * @throws {AppError} - Throws an error if no record is found or on database failure.
 */
const getAuthIdByUserId = async (client, userId) => {
  const sql = `
    SELECT id
    FROM user_auth
    WHERE user_id = $1;
  `;

  try {
    const result = await query(sql, [userId], client);

    if (result.rows.length === 0) {
      throw AppError.notFoundError(
        `No user_auth record found for user_id "${userId}".`,
        { query: sql, parameters: [userId] }
      );
    }

    return result.rows[0].id;
  } catch (error) {
    logError(`Error fetching user_auth ID for user_id "${userId}"`, {
      query: sql,
      parameters: [userId],
      error: error.message,
    });

    throw AppError.databaseError('Failed to fetch user_auth ID.', {
      isExpected: false,
      details: error.message,
    });
  }
};

/**
 * Fetches user authentication details by email and optionally locks the corresponding row.
 *
 * @param {object} client - The database client.
 * @param {string} email - The user's email.
 * @returns {Promise<object>} - The locked user authentication details.
 * @throws {AppError} - Throws an error if the user is not found or inactive.
 */
const getUserAuthByEmail = async (client, email) => {
  const sql = `
    SELECT
      u.id AS user_id,
      u.email,
      u.role_id,
      ua.password_hash AS passwordHash,
      ua.password_salt AS passwordSalt,
      ua.last_login,
      ua.attempts,
      ua.failed_attempts,
      ua.lockout_time
    FROM users u
    INNER JOIN user_auth ua ON u.id = ua.user_id
    INNER JOIN status s ON u.status_id = s.id
    WHERE u.email = $1 AND s.name = 'active';
  `;

  try {
    // Retry fetching user details in case of transient errors
    const user = await retry(async () => {
      const result = await query(sql, [email], client);
      if (result.rows.length === 0) {
        throw AppError.notFoundError('User not found or inactive', {
          isExpected: true,
        });
      }
      return result.rows[0];
    });

    // Fetch the `id` from the `user_auth` table
    const authId = await getAuthIdByUserId(client, user.user_id);

    // Lock the user's row in the `users` and `user_auth` tables for subsequent updates
    await lockRow(client, 'users', user.user_id, 'FOR UPDATE');
    await lockRow(client, 'user_auth', authId, 'FOR UPDATE');

    return user;
  } catch (error) {
    logError(`Error fetching user auth for email "${email}":`, error);
    throw AppError.databaseError(
      'Failed to fetch user authentication details',
      {
        isExpected: false,
        details: { email },
      }
    );
  }
};

/**
 * Increments failed login attempts for a user and applies lockout if needed.
 *
 * This function locks the user's row to ensure consistent updates, increments the failed login attempts,
 * and sets a lockout time if the threshold is reached. It also updates the cumulative total login attempts
 * for auditing purposes.
 *
 * @async
 * @param {object} client - The database client used for the transaction.
 * @param {uuid} userId - The user's ID.
 * @param {number} newTotalAttempts - The cumulative number of total login attempts (successful and failed).
 * @param {number} currentAttempts - The current number of failed login attempts.
 * @returns {Promise<void>} - Resolves when the update is successful.
 * @throws {AppError} - Throws an error if the update fails or retry limits are exceeded.
 */
const incrementFailedAttempts = async (
  client,
  userId,
  newTotalAttempts,
  currentAttempts
) => {
  const newFailedAttempts = currentAttempts + 1;
  let lockoutTime = null;
  let notes = null;

  // Apply lockout if the threshold is reached
  if (newFailedAttempts >= 15) {
    lockoutTime = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
    notes = 'Account locked due to multiple failed attempts.';
  }

  // SQL query for updating failed attempts and metadata
  const sql = `
    UPDATE user_auth
    SET
      attempts = $1,
      failed_attempts = $2,
      lockout_time = $3,
      metadata = jsonb_set(
        jsonb_set(
          COALESCE(metadata, '{}'),
          '{lastLockout}',
          to_jsonb($4::timestamp),
          true
        ),
        '{notes}',
        to_jsonb($5::text),
        true
      ),
      updated_at = NOW()
    WHERE user_id = $6;
  `;

  try {
    // Retry logic for transient errors
    await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      // Lock the user's row to ensure consistency during the update
      await lockRow(client, 'user_auth', authId);

      // Execute the update query
      await query(
        sql,
        [
          newTotalAttempts,
          newFailedAttempts,
          lockoutTime,
          lockoutTime,
          notes,
          userId,
        ],
        client
      );
    });
  } catch (error) {
    logError(
      `Error incrementing failed attempts for user ID ${userId}:`,
      error
    );
    throw AppError.accountLockedError('Failed to update failed attempts', {
      isExpected: false,
    });
  }
};

/**
 * Resets failed login attempts, updates the last login time, and records the total attempts for a user.
 *
 * This function ensures consistency by locking the user's row during the update
 * and retrying on transient errors. It updates the `failed_attempts` field to 0,
 * logs the last successful login time, and records the cumulative number of login attempts
 * in the metadata for auditing purposes.
 *
 * @async
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The user's ID.
 * @param {number} newTotalAttempts - The cumulative number of total login attempts (successful and failed).
 * @returns {Promise<void>} Resolves when the update is successful.
 * @throws {AppError} If the query fails due to a database error or retry limits are exceeded.
 */
const resetFailedAttemptsAndUpdateLastLogin = async (
  client,
  userId,
  newTotalAttempts
) => {
  const sql = `
    UPDATE user_auth
    SET
      attempts = $1,
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
    WHERE user_id = $2
  `;

  try {
    await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      // Lock the user's row to ensure consistency
      await lockRow(client, 'user_auth', authId);

      // Execute the update query
      await query(sql, [newTotalAttempts, userId], client);
    });
  } catch (error) {
    logError(
      `Error resetting failed attempts and updating last login for user ID ${userId}:`,
      error
    );
    throw AppError.databaseError(
      'Failed to reset failed attempts or update last login',
      {
        isExpected: false,
      }
    );
  }
};

/**
 * Fetches a limited password history for a user, ordered by the most recent entry.
 *
 * This function retrieves the `password_history` from the `metadata` column of the `user_auth` table,
 * ensuring only the latest entries (e.g., limited to 4 or 5) are returned.
 * It uses retry logic for resilience and optional row locking for consistency.
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
    return await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      // Optionally lock the row to ensure consistency
      await lockRow(client, 'user_auth', authId);

      // Execute the query to fetch password history
      const result = await client.query(sql, [userId]);

      // Return the limited history or an empty array if none exists
      return result.rows[0]?.limited_history || [];
    });
  } catch (error) {
    logError('Error fetching password history:', error);

    // Throw a structured AppError for better error handling
    throw AppError.databaseError('Failed to fetch password history');
  }
};

/**
 * Verifies if the provided plain-text password matches the current password
 * stored in the database for a given user.
 *
 * This function retrieves the user's current password hash and salt from the database,
 * then uses a secure hashing algorithm to validate the provided plain-text password.
 * It includes retry logic for resilience and row locking for consistency.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The ID of the user whose password is being verified.
 * @param {string} plainPassword - The plain-text password to verify.
 * @returns {Promise<boolean>} - True if the password matches, false otherwise.
 * @throws {AppError} - Throws an error if the user is not found or if there is
 *                      an issue querying the database.
 */
const verifyCurrentPassword = async (client, userId, plainPassword) => {
  const sql = `
    SELECT password_hash, password_salt
    FROM user_auth
    WHERE user_id = $1
  `;

  try {
    return await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      // Lock the user's row for consistency
      await lockRow(client, 'user_auth', authId);

      // Fetch the current password hash and salt from the database
      const result = await client.query(sql, [userId]);

      if (result.rows.length === 0) {
        throw AppError.notFoundError('User not found', { isExpected: true });
      }

      const { password_hash: passwordHash, password_salt: passwordSalt } =
        result.rows[0];

      // Verify the plain-text password against the stored hash and salt
      const isMatch = await verifyPassword(
        plainPassword,
        passwordHash,
        passwordSalt
      );

      if (!isMatch) {
        return false;
      }

      // Return whether the passwords match
      return true;
    });
  } catch (error) {
    // Log the error and throw a structured AppError for better error handling
    logError('Error verifying current password:', error);
    throw AppError.databaseError('Failed to verify current password');
  }
};

/**
 * Checks if a given password has been reused by the user.
 *
 * This function fetches the user's password history, locks the relevant row for updates,
 * and verifies the new plain-text password against each stored hash in the history.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} newPassword - The plain-text password to validate against the user's password history.
 * @returns {Promise<boolean>} - Returns true if the password has been reused, otherwise false.
 * @throws {AppError} - Throws an AppError if a database or validation error occurs.
 */
const isPasswordReused = async (client, userId, newPassword) => {
  try {
    // Lock the user's row in the `user_auth` table to ensure consistent read during password reuse check
    await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      await lockRow(client, 'user_auth', authId, 'FOR UPDATE');
    });

    // Fetch the user's password history
    const passwordHistory = await fetchPasswordHistory(client, userId);

    // Compare the provided plain-text password with each stored hash
    for (const historyEntry of passwordHistory) {
      const { password_hash, password_salt } = historyEntry;

      const isMatch = await verifyPassword(
        newPassword,
        password_hash,
        password_salt
      );
      if (isMatch) {
        return true; // Password matches a previously used password
      }
    }

    return false; // No match found
  } catch (error) {
    // Log the error and throw a structured AppError for better error handling
    logError('Error checking password reuse:', error);
    throw AppError.databaseError('Failed to check password reuse', {
      details: { userId },
    });
  }
};

/**
 * Updates the password history for a user in the `user_auth` table with retry and row locking.
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
    // Retry and lock the row before updating
    await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      await lockRow(client, 'user_auth', authId, 'FOR UPDATE');
      const result = await query(
        sql,
        [JSON.stringify(updatedHistory), userId],
        client
      );
      if (result.rowCount === 0) {
        throw AppError.notFoundError(
          `Failed to update password history for user ${userId}`
        );
      }
    });

    return true;
  } catch (error) {
    logError('Error updating password history:', error);
    throw AppError.databaseError('Failed to update password history');
  }
};

/**
 * Updates the user's password hash and salt in the `user_auth` table with retry and row locking.
 *
 * @param {object} client - The database client used in the transaction.
 * @param {string} userId - The unique identifier of the user whose password is being updated.
 * @param {string} hashedPassword - The newly hashed password to store.
 * @param {string} passwordSalt - The salt used to hash the new password.
 * @returns {Promise<boolean>} - Resolves to `true` if the update was successful, otherwise `false`.
 * @throws {AppError} - Throws a structured `AppError` if the update fails.
 */
const updatePasswordHashAndSalt = async (
  client,
  userId,
  hashedPassword,
  passwordSalt
) => {
  const sql = `
    UPDATE user_auth
    SET
      password_hash = $1,
      password_salt = $2,
      updated_at = NOW()
    WHERE user_id = $3
  `;

  try {
    // Retry and lock the row before updating
    await retry(async () => {
      const authId = await getAuthIdByUserId(client, userId);
      await lockRow(client, 'user_auth', authId, 'FOR UPDATE');
      const result = await query(
        sql,
        [hashedPassword, passwordSalt, userId],
        client
      );
      if (result.rowCount === 0) {
        throw AppError.notFoundError(
          `Failed to update password hash and salt for user ${userId}`
        );
      }
    });

    return true;
  } catch (error) {
    logError('Error updating password hash and salt:', error);
    throw AppError.databaseError('Failed to update password hash and salt');
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
