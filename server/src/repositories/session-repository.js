/**
 * @file session-repository.js
 * @description Database access layer for session records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from session-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertSession                — insert new session record
 *  - getSessionById               — fetch session by id
 *  - revokeSessionsByUserId       — revoke all active sessions for a user
 *  - updateSessionLastActivityAt  — throttled activity timestamp update
 *  - revokeSessionRowById         — revoke single session by id
 *  - logoutSessionRowById         — logout and revoke single session by id
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  SESSION_INSERT_QUERY,
  SESSION_GET_BY_ID_QUERY,
  SESSION_REVOKE_BY_USER_QUERY,
  SESSION_UPDATE_ACTIVITY_QUERY,
  SESSION_REVOKE_BY_ID_QUERY,
  SESSION_LOGOUT_BY_ID_QUERY,
} = require('./queries/session-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a new session record and returns the created row.
 *
 * @param {Object}                session
 * @param {string}                session.userId      - UUID of the user.
 * @param {string | Date}         session.expiresAt   - Session expiry as ISO string or Date object.
 * @param {string|null}           [session.ipAddress] - Client IP address.
 * @param {string|null}           [session.userAgent] - Client user agent string.
 * @param {string|null}           [session.deviceId]  - Device identifier.
 * @param {string|null}           [session.note]      - Optional session note.
 * @param {PoolClient} client                         - DB client for transactional context.
 *
 * @returns {Promise<{ id: string, user_id: string, created_at: Date, last_activity_at: Date, expires_at: Date }>}
 * @throws  {AppError} Normalized database error if the insert fails.
 */
const insertSession = async (session, client) => {
  const context = 'session-repository/insertSession';

  const {
    userId,
    expiresAt,
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    note = null,
  } = session;

  const params = [userId, expiresAt, ipAddress, userAgent, deviceId, note];

  try {
    const { rows } = await query(SESSION_INSERT_QUERY, params, client);
    return rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert session.',
      meta: { userId },
      logFn: (err) =>
        logDbQueryError(SESSION_INSERT_QUERY, params, err, { context, userId }),
    });
  }
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches a session record by ID.
 *
 * Returns null if no session exists for the given ID.
 *
 * @param {string}                      sessionId     - UUID of the session.
 * @param {PoolClient|null} [client=null]
 *
 * @returns {Promise<Object|null>} Session row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getSessionById = async (sessionId, client = null) => {
  const context = 'session-repository/getSessionById';

  try {
    const { rows } = await query(SESSION_GET_BY_ID_QUERY, [sessionId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch session by ID.',
      meta: { sessionId },
      logFn: (err) =>
        logDbQueryError(SESSION_GET_BY_ID_QUERY, [sessionId], err, {
          context,
          sessionId,
        }),
    });
  }
};

// ─── Revoke ───────────────────────────────────────────────────────────────────

/**
 * Revokes all active sessions for a given user.
 *
 * Returns an empty array if no active sessions exist.
 *
 * @param {string}                      userId        - UUID of the user.
 * @param {PoolClient|null} [client=null]
 *
 * @returns {Promise<Array<{ id: string }>>} Revoked session rows.
 * @throws  {AppError}                        Normalized database error if the update fails.
 */
const revokeSessionsByUserId = async (userId, client = null) => {
  const context = 'session-repository/revokeSessionsByUserId';

  try {
    const { rows } = await query(
      SESSION_REVOKE_BY_USER_QUERY,
      [userId],
      client
    );
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to revoke sessions for user.',
      meta: { userId },
      logFn: (err) =>
        logDbQueryError(SESSION_REVOKE_BY_USER_QUERY, [userId], err, {
          context,
          userId,
        }),
    });
  }
};

// ─── Activity ─────────────────────────────────────────────────────────────────

/**
 * Updates last_activity_at for a session with a 5-minute throttle guard.
 *
 * Returns false if the session is already active within the throttle window
 * or does not exist — not treated as an error.
 *
 * @param {string}                      sessionId     - UUID of the session.
 * @param {PoolClient|null} [client=null]
 *
 * @returns {Promise<boolean>} True if the activity timestamp was updated.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const updateSessionLastActivityAt = async (sessionId, client = null) => {
  const context = 'session-repository/updateSessionLastActivityAt';

  try {
    const { rowCount } = await query(
      SESSION_UPDATE_ACTIVITY_QUERY,
      [sessionId],
      client
    );
    return rowCount > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to update session activity.',
      meta: { sessionId },
      logFn: (err) =>
        logDbQueryError(SESSION_UPDATE_ACTIVITY_QUERY, [sessionId], err, {
          context,
          sessionId,
        }),
    });
  }
};

/**
 * Revokes a single session by ID.
 *
 * Returns false if the session is already revoked or does not exist.
 *
 * @param {string}                      sessionId     - UUID of the session.
 * @param {PoolClient|null} [client=null]
 *
 * @returns {Promise<boolean>} True if the session was revoked.
 * @throws  {AppError}          Normalized database error if the update fails.
 */
const revokeSessionRowById = async (sessionId, client = null) => {
  const context = 'session-repository/revokeSessionRowById';

  try {
    const { rowCount } = await query(
      SESSION_REVOKE_BY_ID_QUERY,
      [sessionId],
      client
    );
    return rowCount > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to revoke session.',
      meta: { sessionId },
      logFn: (err) =>
        logDbQueryError(SESSION_REVOKE_BY_ID_QUERY, [sessionId], err, {
          context,
          sessionId,
        }),
    });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Logs out a session by setting logout_at and revoked_at.
 *
 * COALESCE preserves existing values if the session is already logged out
 * or revoked. Returns null if the session was already logged out.
 *
 * @param {string}                  sessionId - UUID of the session.
 * @param {PoolClient} client    - DB client for transactional context.
 *
 * @returns {Promise<{ id: string, user_id: string }|null>}
 * @throws  {AppError} Normalized database error if the update fails.
 */
const logoutSessionRowById = async (sessionId, client) => {
  const context = 'session-repository/logoutSessionRowById';

  try {
    const { rows } = await query(
      SESSION_LOGOUT_BY_ID_QUERY,
      [sessionId],
      client
    );
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to logout session.',
      meta: { sessionId },
      logFn: (err) =>
        logDbQueryError(SESSION_LOGOUT_BY_ID_QUERY, [sessionId], err, {
          context,
          sessionId,
        }),
    });
  }
};

module.exports = {
  insertSession,
  getSessionById,
  revokeSessionsByUserId,
  updateSessionLastActivityAt,
  revokeSessionRowById,
  logoutSessionRowById,
};
