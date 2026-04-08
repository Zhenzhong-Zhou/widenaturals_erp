/**
 * @file user-auth-repository.js
 * @description Database access layer for user authentication records.
 *
 * Auth infrastructure pattern — differs from domain repos in two ways:
 *  - Errors are re-thrown raw (no handleDbError wrapping); the auth service
 *    owns error handling and needs the original error, not a normalized wrapper.
 *    Exception: incrementFailedAttempts and resetFailedAttemptsAndUpdateLastLogin
 *    wrap with AppError.databaseError since their callers expect a normalized error.
 *  - Security-relevant success logging is retained on insert and password update.
 *
 * Exports:
 *  - insertUserAuth                          — insert a new user_auth row
 *  - getAndLockUserAuthByEmail               — fetch and row-lock auth by email
 *  - getAndLockUserAuthByUserId              — fetch and row-lock auth by user id
 *  - incrementFailedAttempts                 — increment failed attempts and conditionally set lockout
 *  - resetFailedAttemptsAndUpdateLastLogin   — reset failed attempts and stamp last_login
 *  - updatePasswordAndHistory                — update password hash and history metadata
 */

'use strict';

const { query } = require('../database/db');
const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
} = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  INSERT_USER_AUTH_QUERY,
  GET_AND_LOCK_USER_AUTH_BY_EMAIL_QUERY,
  GET_AND_LOCK_USER_AUTH_BY_USER_ID_QUERY,
  INCREMENT_FAILED_ATTEMPTS_QUERY,
  RESET_FAILED_ATTEMPTS_AND_UPDATE_LOGIN_QUERY,
  UPDATE_PASSWORD_AND_HISTORY_QUERY,
} = require('./queries/user-auth-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a new user_auth row for the given user.
 *
 * @param {Object}                  options
 * @param {string}                  options.userId       - UUID of the user.
 * @param {string}                  options.passwordHash - Hashed password value.
 * @param {import('pg').PoolClient} client               - Transaction client.
 *
 * @returns {Promise<void>}
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const insertUserAuth = async ({ userId, passwordHash }, client) => {
  const context = 'user-auth-repository/insertUserAuth';
  const params  = [userId, passwordHash];
  
  try {
    await query(INSERT_USER_AUTH_QUERY, params, client);
    
    logSystemInfo('User auth inserted successfully', {
      context,
      userId,
    });
  } catch (error) {
    logSystemException(error, 'Failed to insert user auth', {
      context,
      userId,
    });
    throw error;
  }
};

// ─── Fetch and Lock by Email ──────────────────────────────────────────────────

/**
 * Fetches and row-locks the user auth record matching the given email and status.
 *
 * Must be called inside a transaction — uses FOR UPDATE OF ua.
 * Throws a notFoundError (isExpected: true) if no matching active user exists.
 *
 * @param {string}                  email          - Email address to look up.
 * @param {string}                  activeStatusId - UUID of the active status.
 * @param {import('pg').PoolClient} client         - Transaction client.
 *
 * @returns {Promise<Object>} User auth row.
 * @throws  {AppError} notFoundError if user not found or inactive.
 * @throws  {AppError} databaseError on unexpected DB failure.
 */
const getAndLockUserAuthByEmail = async (email, activeStatusId, client) => {
  const context = 'user-auth-repository/getAndLockUserAuthByEmail';
  
  try {
    const { rows } = await query(
      GET_AND_LOCK_USER_AUTH_BY_EMAIL_QUERY,
      [email, activeStatusId],
      client
    );
    
    if (rows.length === 0) {
      throw AppError.notFoundError('User not found or inactive', {
        isExpected: true,
      });
    }
    
    return rows[0];
  } catch (error) {
    if (error.isExpected) throw error;
    
    logSystemException(error, 'Failed to fetch and lock user auth by email', {
      context,
      email,
    });
    
    throw AppError.databaseError('Failed to fetch user authentication details', {
      isExpected: false,
      details:    { email },
    });
  }
};

// ─── Fetch and Lock by User ID ────────────────────────────────────────────────

/**
 * Fetches and row-locks the user auth record for the given user id.
 *
 * Must be called inside a transaction — uses FOR UPDATE OF ua.
 * Throws a notFoundError (isExpected: true) if no auth record exists.
 *
 * @param {string}                  userId - UUID of the user.
 * @param {import('pg').PoolClient} client - Transaction client.
 *
 * @returns {Promise<Object>} User auth row.
 * @throws  {AppError} validationError if userId is absent.
 * @throws  {AppError} serviceError if client is absent.
 * @throws  {AppError} notFoundError if auth record not found.
 * @throws  {AppError} databaseError on unexpected DB failure.
 */
const getAndLockUserAuthByUserId = async (userId, client) => {
  const context = 'user-auth-repository/getAndLockUserAuthByUserId';
  
  if (!userId) throw AppError.validationError('User ID is required.');
  if (!client) throw AppError.serviceError('Transaction client is required.');
  
  try {
    const { rows } = await query(
      GET_AND_LOCK_USER_AUTH_BY_USER_ID_QUERY,
      [userId],
      client
    );
    
    if (rows.length === 0) {
      throw AppError.notFoundError('User authentication record not found.', {
        isExpected: true,
      });
    }
    
    return rows[0];
  } catch (error) {
    if (error.isExpected) throw error;
    
    logSystemException(error, 'Failed to fetch and lock user auth by user ID', {
      context,
      userId,
    });
    
    throw AppError.databaseError('Failed to fetch user authentication details.', {
      isExpected: false,
      details:    { userId },
    });
  }
};

// ─── Increment Failed Attempts ────────────────────────────────────────────────

/**
 * Increments failed login attempts and sets a lockout if the threshold is reached.
 *
 * Lockout threshold: 15 failed attempts → 30 minute lockout.
 *
 * @param {string}                  authId                - UUID of the user_auth row.
 * @param {number}                  newTotalAttempts      - New cumulative attempt count.
 * @param {number}                  currentFailedAttempts - Current failed attempt count before increment.
 * @param {import('pg').PoolClient} client                - Transaction client.
 *
 * @returns {Promise<void>}
 * @throws  {AppError} databaseError if the update fails.
 */
const incrementFailedAttempts = async (
  authId,
  newTotalAttempts,
  currentFailedAttempts,
  client
) => {
  const context = 'user-auth-repository/incrementFailedAttempts';
  
  const newFailedAttempts = currentFailedAttempts + 1;
  const lockoutTime       = newFailedAttempts >= 15
    ? new Date(Date.now() + 30 * 60 * 1000)
    : null;
  const notes             = lockoutTime !== null
    ? 'Account locked due to multiple failed login attempts.'
    : null;
  
  try {
    await query(
      INCREMENT_FAILED_ATTEMPTS_QUERY,
      [newTotalAttempts, newFailedAttempts, lockoutTime, lockoutTime, notes, authId],
      client
    );
  } catch (error) {
    logSystemException(error, 'Failed to increment failed login attempts', {
      context,
      authId,
    });
    throw AppError.databaseError('Failed to update failed login attempts.', {
      cause: error,
      context,
    });
  }
};

// ─── Reset Failed Attempts ────────────────────────────────────────────────────

/**
 * Resets failed attempts to zero, clears lockout, and stamps last_login.
 *
 * Called on successful authentication.
 *
 * @param {string}                  authId           - UUID of the user_auth row.
 * @param {number}                  newTotalAttempts - New cumulative attempt count.
 * @param {import('pg').PoolClient} client           - Transaction client.
 *
 * @returns {Promise<void>}
 * @throws  {AppError} databaseError if the update fails.
 */
const resetFailedAttemptsAndUpdateLastLogin = async (authId, newTotalAttempts, client) => {
  const context = 'user-auth-repository/resetFailedAttemptsAndUpdateLastLogin';
  
  try {
    await query(
      RESET_FAILED_ATTEMPTS_AND_UPDATE_LOGIN_QUERY,
      [newTotalAttempts, authId],
      client
    );
  } catch (error) {
    logSystemException(error, 'Failed to reset failed login attempts and update last login', {
      context,
      authId,
    });
    throw AppError.databaseError('Failed to reset failed attempts or update last login.', {
      cause: error,
      context,
    });
  }
};

// ─── Update Password and History ──────────────────────────────────────────────

/**
 * Updates the password hash and appends to the password history metadata.
 *
 * Returns null if the auth record was not found (no rows updated).
 *
 * @param {string}                  authId          - UUID of the user_auth row.
 * @param {string}                  newPasswordHash - New hashed password value.
 * @param {Array}                   updatedHistory  - Updated password history array.
 * @param {import('pg').PoolClient} [client]        - Optional transaction client.
 *
 * @returns {Promise<{id: string}|null>} Updated row id, or null if not found.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const updatePasswordAndHistory = async (authId, newPasswordHash, updatedHistory, client = null) => {
  const context = 'user-auth-repository/updatePasswordAndHistory';
  const params  = [newPasswordHash, JSON.stringify(updatedHistory), authId];
  
  try {
    const { rows } = await query(UPDATE_PASSWORD_AND_HISTORY_QUERY, params, client);
    
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
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to update password and history', {
      context,
      authId,
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
