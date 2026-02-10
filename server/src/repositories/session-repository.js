const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Inserts a new session record into the `sessions` table.
 *
 * Repository-layer function:
 * - Executes a single INSERT statement
 * - Assumes one session per call (NO bulk inserts)
 * - Relies on database constraints for integrity
 * - Does NOT handle session revocation, rotation, or limits
 * - Throws raw database errors to preserve full error context
 *
 * Session lifecycle decisions (single-session, multi-device, revocation)
 * MUST be handled in the service / business layer.
 *
 * @param {Object} session - Session data to insert
 * @param {Object} client - Database client or transaction
 *
 * @returns {Promise<Object>} Inserted session summary
 *
 * @throws {Error} Raw database errors:
 * - Foreign key violations (user_id)
 * - Unique constraint violations (session_token_hash)
 * - Other database-level failures
 */
const insertSession = async (session, client) => {
  const context = 'session-repository/insertSession';
  
  const {
    userId,
    sessionTokenHash,
    expiresAt,
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    note = null,
  } = session;
  
  const queryText = `
    INSERT INTO sessions (
      user_id,
      session_token_hash,
      expires_at,
      ip_address,
      user_agent,
      device_id,
      note
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING
      id,
      user_id,
      created_at,
      last_activity_at,
      expires_at;
  `;
  
  const params = [
    userId,
    sessionTokenHash,
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
 * - Operates ONLY on the `sessions` table
 * - Marks sessions as revoked via `revoked_at`
 * - Does NOT revoke tokens
 * - Safe to call multiple times (idempotent)
 *
 * @param {string} userId
 * @param {Object|null} client
 *
 * @returns {Promise<number>} Number of revoked sessions
 *
 * @throws {Error} Raw database errors
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
    
    return rows.length;
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

module.exports = {
  insertSession,
  getSessionById,
  revokeSessionsByUserId,
  updateSessionLastActivityAt,
};
