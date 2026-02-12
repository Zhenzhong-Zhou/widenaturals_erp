const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Inserts a new session record into the `sessions` table.
 *
 * Repository-layer function:
 * - Executes a single INSERT statement
 * - Assumes one session per call (NO bulk inserts)
 * - Relies on database constraints for integrity
 * - Does NOT create or manage tokens
 * - Does NOT enforce session limits or revocation rules
 * - Preserves raw database errors
 *
 * IMPORTANT:
 * Session lifecycle decisions (single-session policy, multi-device handling,
 * token issuance, revocation, rotation) MUST be handled in the service layer.
 *
 * @param {Object} session - Session data to insert
 * @param {string} session.userId
 * @param {Date} session.expiresAt
 * @param {string|null} [session.ipAddress]
 * @param {string|null} [session.userAgent]
 * @param {string|null} [session.deviceId]
 * @param {string|null} [session.note]
 * @param {Object} client - Database client or transaction
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   created_at: Date,
 *   last_activity_at: Date,
 *   expires_at: Date
 * }>}
 *
 * @throws {Error} Raw database errors such as:
 * - Foreign key violations (user_id)
 * - Other database-level failures
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
  
  const queryText = `
    INSERT INTO sessions (
      user_id,
      expires_at,
      ip_address,
      user_agent,
      device_id,
      note
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING
      id,
      user_id,
      created_at,
      last_activity_at,
      expires_at;
  `;
  
  const params = [
    userId,
    expiresAt,
    ipAddress,
    userAgent,
    deviceId,
    note,
  ];
  
  try {
    const { rows } = await query(queryText, params, client);
    
    logSystemInfo('Session inserted successfully', {
      context,
      sessionId: rows[0]?.id,
      userId,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to insert session', {
      context,
      userId,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Fetches a session row by ID.
 *
 * Repository-layer function:
 * - Executes a single SELECT
 * - Returns session row or null
 * - Does NOT enforce expiry or revocation semantics
 * - Preserves raw database errors
 *
 * @param {string} sessionId
 * @param {Object|null} client
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   expires_at: Date,
 *   revoked_at: Date | null,
 *   logout_at: Date | null
 * } | null>}
 */
const getSessionById = async (sessionId, client = null) => {
  const context = 'session-repository/getSessionById';
  
  const queryText = `
    SELECT
      id,
      user_id,
      expires_at,
      revoked_at,
      logout_at
    FROM sessions
    WHERE id = $1
    LIMIT 1;
  `;
  
  try {
    const { rows } = await query(queryText, [sessionId], client);
    
    if (!rows[0]) {
      return null;
    }
    
    logSystemInfo('Session fetched by id', {
      context,
      sessionId: rows[0].id,
      userId: rows[0].user_id,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch session by id', {
      context,
      sessionId,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Revokes all active sessions for a user.
 *
 * Repository guarantees:
 * - Operates exclusively on the `sessions` table
 * - Marks non-revoked sessions as revoked by setting `revoked_at`
 * - Does NOT revoke associated tokens (caller responsibility)
 * - Idempotent: calling multiple times will not re-revoke sessions
 *
 * Behavior:
 * - Only sessions with `revoked_at IS NULL` are affected
 * - Returns identifiers of sessions revoked during this call
 *
 * @param {string} userId - Target user identifier
 * @param {Object|null} client - Optional transaction client
 *
 * @returns {Promise<Array<{ id: string }>>}
 *   Array of session rows that were revoked in this operation.
 *
 * @throws {Error} Propagates raw database errors
 */
const revokeSessionsByUserId = async (userId, client = null) => {
  const context = 'session-repository/revokeSessionsByUserId';
  
  const sql = `
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE user_id = $1
      AND revoked_at IS NULL
    RETURNING id;
  `;
  
  try {
    const { rows } = await query(sql, [userId], client);
    
    logSystemInfo('Sessions revoked for user', {
      context,
      userId,
      revokedCount: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to revoke sessions for user', {
      context,
      userId,
    });
    throw error;
  }
};

/**
 * Updates session last_activity_at timestamp.
 *
 * Repository guarantees:
 * - Safe to call multiple times
 * - Rate-limited at SQL level
 * - No validation or business logic
 *
 * Semantics:
 * - Marks session as "recently active"
 * - Does NOT extend expiry
 * - Does NOT revive revoked sessions
 *
 * @param {string} sessionId
 * @param {Object|null} client
 *
 * @returns {Promise<boolean>} true if updated, false if skipped
 */
const updateSessionLastActivityAt = async (sessionId, client = null) => {
  const context = 'session-repository/updateSessionLastActivityAt';
  
  const sql = `
    UPDATE sessions
    SET last_activity_at = NOW()
    WHERE id = $1
      AND revoked_at IS NULL
      AND (
        last_activity_at IS NULL
        OR last_activity_at < NOW() - INTERVAL '5 minutes'
      )
    RETURNING id;
  `;
  
  try {
    const { rowCount } = await query(sql, [sessionId], client);
    
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to update session activity', {
      context,
      sessionId,
    });
    throw error;
  }
};

/**
 * Marks a session as revoked.
 *
 * Repository guarantees:
 * - Safe to call multiple times (idempotent)
 * - Performs a single, bounded UPDATE
 * - No validation or business logic
 *
 * Semantics:
 * - Permanently invalidates the session
 * - Does NOT revoke tokens (handled by business layer)
 * - Does NOT affect logout timestamps
 *
 * @param {string} sessionId
 * @param {Object|null} client
 *
 * @returns {Promise<boolean>} true if session was revoked, false if already revoked
 */
const revokeSessionRowById = async (sessionId, client = null) => {
  const context = 'session-repository/revokeSessionRowById';
  
  const sql = `
    UPDATE sessions
    SET
      revoked_at = NOW()
    WHERE id = $1
      AND revoked_at IS NULL
    RETURNING id;
  `;
  
  try {
    const { rowCount } = await query(sql, [sessionId], client);
    
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to revoke session', {
      context,
      sessionId,
    });
    throw error;
  }
};

/**
 * Marks a session as explicitly logged out by the user.
 *
 * Repository-layer function:
 * - Executes a single, bounded UPDATE
 * - Idempotent (safe to call multiple times)
 * - Does NOT enforce business logic
 * - Preserves raw database errors
 *
 * Semantics:
 * - Records voluntary user logout
 * - Sets logout_at and revoked_at if not already set
 * - Distinguishes user logout from security-triggered revocation
 *
 * @param {string} sessionId
 * @param {Object|null} client - Optional transaction client
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string
 * } | null>}
 *   Updated session identifiers, or null if no active session was updated
 */
const logoutSessionRowById = async (sessionId, client) => {
  const context = 'session-repository/logoutSessionRowById';
  
  const sql = `
    UPDATE sessions
    SET
      logout_at  = COALESCE(logout_at, NOW()),
      revoked_at = COALESCE(revoked_at, NOW())
    WHERE id = $1
      AND logout_at IS NULL
    RETURNING id, user_id;
  `;
  
  try {
    const { rows } = await query(sql, [sessionId], client);
    return rows[0] ?? null;
  } catch (error) {
    logSystemException(error, 'Failed to log out session', {
      context,
      sessionId,
    });
    throw error;
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
