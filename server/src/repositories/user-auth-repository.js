const { query } = require('../database/db');
const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Inserts authentication credentials for a user.
 *
 * Repository-layer function:
 * - Inserts a single user_auth record
 * - Relies on database constraints for integrity
 * - Does NOT handle retries, conflict resolution, or business logic
 * - Throws raw database errors to preserve error context
 *
 * Must be called within the same transaction as user creation.
 *
 * @param {Object} auth
 * @param {string} auth.userId - User ID (FK to users).
 * @param {string} auth.passwordHash - Hashed password.
 * @param {Object} client - Database client or transaction.
 *
 * @returns {Promise<void>}
 *
 * @throws {Error} Raw database errors:
 * - Unique constraint violation (user already has auth)
 * - Foreign key violation (user does not exist)
 * - Other database-level errors
 */
const insertUserAuth = async ({ userId, passwordHash }, client) => {
  const context = 'user-auth-repository/insertUserAuth';

  const queryText = `
    INSERT INTO user_auth (
      user_id,
      password_hash
    )
    VALUES ($1, $2);
  `;

  const params = [userId, passwordHash];

  try {
    await query(queryText, params, client);

    logSystemInfo('User auth inserted successfully', {
      context,
      userId,
    });
  } catch (error) {
    logSystemException(error, 'Failed to insert user auth', {
      context,
      userId,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Fetches active user authentication details by email and acquires
 * a row-level lock on the corresponding user_auth record.
 *
 * This function is intended for login flows that perform
 * stateful mutations (e.g. failed attempt increments, lockouts,
 * last_login updates) and therefore must be executed within
 * an explicit transaction.
 *
 * Locking is applied at SELECT time using `FOR UPDATE` to prevent
 * concurrent login attempts from causing inconsistent auth state.
 *
 * @param {string} email - The user's email address.
 * @param {string} activeStatusId - The resolved status ID representing an active user.
 * @param {object} client - Transaction-scoped database client.
 *
 * @returns {Promise<object>} Locked user authentication record, including auth metadata.
 *
 * @throws {AppError} If the user does not exist, is inactive, or a database error occurs.
 */
const getAndLockUserAuthByEmail = async (email, activeStatusId, client) => {
  const context = 'user-auth-repository/getAndLockUserAuthByEmail';

  const sql = `
    SELECT
      u.id            AS user_id,
      u.email,
      u.role_id,
      ua.id           AS auth_id,
      ua.password_hash,
      ua.last_login,
      ua.attempts,
      ua.failed_attempts,
      ua.lockout_time
    FROM users u
    JOIN user_auth ua ON ua.user_id = u.id
    WHERE u.email = $1
      AND u.status_id = $2
    FOR UPDATE OF ua;
  `;

  try {
    const { rows } = await query(sql, [email, activeStatusId], client);

    if (rows.length === 0) {
      throw AppError.notFoundError('User not found or inactive', {
        isExpected: true,
      });
    }

    return rows[0];
  } catch (error) {
    if (error.isExpected) {
      throw error;
    }

    logSystemException(
      error,
      'Failed to fetch and lock user authentication by email',
      {
        context,
        email,
        error: error.message,
      }
    );

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
 * Fetches and locks the authentication record for a user.
 *
 * Guarantees (on success):
 * - Returns the user's authentication state
 * - Acquires a row-level lock on `user_auth` via `FOR UPDATE`
 * - Prevents concurrent mutation of authentication state
 *
 * Concurrency contract:
 * - MUST be executed within an active transaction
 * - Lock is held until transaction commit or rollback
 * - Ensures serialized updates to password, lockout, and attempt counters
 *
 * Scope:
 * - Locks only the `user_auth` row
 * - Does NOT lock the `users` table
 * - Does NOT perform business validation
 *
 * @param {string} userId - Target user identifier
 * @param {Object} client - Transaction-scoped database client (required)
 *
 * @returns {Promise<{
 *   user_id: string,
 *   email: string,
 *   role_id: string,
 *   auth_id: string,
 *   password_hash: string,
 *   last_login: Date | null,
 *   attempts: number,
 *   failed_attempts: number,
 *   lockout_time: Date | null,
 *   metadata: {
 *     password_history?: Array<{
 *       password_hash: string,
 *       changed_at: string
 *     }>,
 *     lastSuccessfulLogin?: string,
 *     lastLockout?: string,
 *     notes?: string
 *   } | null
 * }>}
 *
 * @throws {AppError}
 */
const getAndLockUserAuthByUserId = async (userId, client) => {
  const context = 'user-auth-repository/getAndLockUserAuthByUserId';

  if (!userId) {
    throw AppError.validationError('User ID is required.');
  }

  if (!client) {
    throw AppError.serviceError('Transaction client is required.');
  }

  const sql = `
    SELECT
      u.id            AS user_id,
      u.email,
      u.role_id,
      ua.id           AS auth_id,
      ua.password_hash,
      ua.last_login,
      ua.attempts,
      ua.failed_attempts,
      ua.lockout_time,
      ua.metadata
    FROM users u
    JOIN user_auth ua ON ua.user_id = u.id
    WHERE u.id = $1
    FOR UPDATE OF ua;
  `;

  try {
    const { rows } = await query(sql, [userId], client);

    if (rows.length === 0) {
      throw AppError.notFoundError('User authentication record not found.', {
        isExpected: true,
      });
    }

    return rows[0];
  } catch (error) {
    if (error.isExpected) {
      throw error;
    }

    logSystemException(
      error,
      'Failed to fetch and lock user authentication by user ID',
      {
        context,
        userId,
        error: error.message,
      }
    );

    throw AppError.databaseError(
      'Failed to fetch user authentication details.',
      {
        isExpected: false,
        details: { userId },
      }
    );
  }
};

/**
 * Increments failed login attempts for a user authentication record
 * and applies an account lockout when the configured threshold is reached.
 *
 * Locking contract:
 * This function assumes the corresponding `user_auth` row has already been
 * locked by the caller (e.g. via `getAndLockUserAuthByEmail`) and MUST be
 * executed within the same database transaction. This function does NOT
 * acquire locks itself.
 *
 * Typical usage:
 *   1. Fetch and lock the user_auth row.
 *   2. Evaluate login credentials.
 *   3. Call this function to record a failed attempt.
 *
 * Concurrency guarantees:
 * - Safe against concurrent login attempts when used as intended.
 * - No retries are performed; mutations are deterministic under lock.
 *
 * @param {string} authId - Primary key of the locked `user_auth` record.
 * @param {number} newTotalAttempts - Updated cumulative count of all login attempts.
 * @param {number} currentFailedAttempts - Current failed login attempt count.
 * @param {object} client - Transaction-scoped database client.
 *
 * @returns {Promise<void>} Resolves when the authentication state is updated.
 *
 * @throws {AppError} If the update fails due to a database error or misuse
 *                    (e.g. missing transaction context).
 */
const incrementFailedAttempts = async (
  authId,
  newTotalAttempts,
  currentFailedAttempts,
  client
) => {
  const context = 'user-auth-repository/incrementFailedAttempts';

  const newFailedAttempts = currentFailedAttempts + 1;

  const lockoutTime =
    newFailedAttempts >= 15
      ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      : null;

  const notes =
    lockoutTime !== null
      ? 'Account locked due to multiple failed login attempts.'
      : null;

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
    WHERE id = $6;
  `;

  try {
    await query(
      sql,
      [
        newTotalAttempts,
        newFailedAttempts,
        lockoutTime,
        lockoutTime,
        notes,
        authId,
      ],
      client
    );
  } catch (error) {
    logSystemException(error, 'Failed to increment failed login attempts', {
      context,
      authId,
      error: error.message,
    });

    throw AppError.databaseError('Failed to update failed login attempts.', {
      cause: error,
      context,
    });
  }
};

/**
 * Resets failed login attempts and records a successful login
 * for a locked user authentication record.
 *
 * Locking contract:
 * This function assumes the corresponding `user_auth` row has already been
 * locked by the caller (e.g. via `getAndLockUserAuthByEmail`) and MUST be
 * executed within the same database transaction. This function does NOT
 * acquire locks itself.
 *
 * Typical usage:
 *   1. Fetch and lock the user_auth row.
 *   2. Verify login credentials.
 *   3. Call this function to reset failure counters and update login metadata.
 *
 * Concurrency guarantees:
 * - Safe under concurrent login attempts when used as intended.
 * - No retries are performed; updates are deterministic under lock.
 *
 * @param {string} authId - Primary key of the locked `user_auth` record.
 * @param {number} newTotalAttempts - Updated cumulative count of all login attempts.
 * @param {object} client - Transaction-scoped database client.
 *
 * @returns {Promise<void>} Resolves when the authentication state is updated.
 *
 * @throws {AppError} If the update fails due to a database error or misuse
 *                    (e.g. missing transaction context).
 */
const resetFailedAttemptsAndUpdateLastLogin = async (
  authId,
  newTotalAttempts,
  client
) => {
  const context = 'user-auth-repository/resetFailedAttemptsAndUpdateLastLogin';

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
      ),
      updated_at = NOW()
    WHERE id = $2;
  `;

  try {
    await query(sql, [newTotalAttempts, authId], client);
  } catch (error) {
    logSystemException(
      error,
      'Failed to reset failed login attempts and update last login',
      {
        context,
        authId,
        error: error.message,
      }
    );

    throw AppError.databaseError(
      'Failed to reset failed attempts or update last login.',
      {
        cause: error,
        context,
      }
    );
  }
};

/**
 * Updates a user's password hash and password history.
 *
 * Repository guarantees:
 * - Performs a single UPDATE statement
 * - Does not contain business logic
 * - Does not validate password policy
 * - Throws on database failure
 *
 * @param {string} authId
 * @param {string} newPasswordHash
 * @param {Array<Object>} updatedHistory
 * @param {Object|null} client
 *
 * @returns {Promise<void>}
 */
const updatePasswordAndHistory = async (
  authId,
  newPasswordHash,
  updatedHistory,
  client = null
) => {
  const context = 'user-auth-repository/updatePasswordAndHistory';

  const sql = `
    UPDATE user_auth
    SET
      password_hash = $1,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'),
        '{password_history}',
        $2::jsonb
      ),
      updated_at = NOW()
    WHERE id = $3
    RETURNING id;
  `;

  const params = [newPasswordHash, JSON.stringify(updatedHistory), authId];

  try {
    const { rows } = await query(sql, params, client);

    if (!rows.length) {
      logSystemWarn('Password update affected no rows', {
        context,
        authId,
      });

      return null;
    }

    logSystemInfo('Password and history updated', {
      context,
      authId,
    });

    return rows[0] || null;
  } catch (error) {
    logSystemException(error, 'Failed to update password and history', {
      context,
      authId,
      error: error.message,
    });

    throw error;
  }
};

module.exports = {
  insertUserAuth,
  getAndLockUserAuthByEmail,
  getAndLockUserAuthByUserId,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
  updatePasswordAndHistory,
};
