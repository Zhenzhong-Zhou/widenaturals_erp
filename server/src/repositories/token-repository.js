const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Inserts a new token record into the `tokens` table.
 *
 * Repository-layer function:
 * - Executes a single INSERT statement
 * - Assumes one token per call (NO bulk inserts)
 * - Relies on database constraints for integrity
 * - Does NOT handle revocation, rotation, or reuse rules
 * - Throws raw database errors to preserve full error context
 *
 * Token lifecycle decisions (refresh rotation, one-time use, session binding)
 * MUST be handled in the service / business layer.
 *
 * @param {Object} token - Token data to insert
 * @param {Object} client - Database client or transaction
 *
 * @returns {Promise<Object>} Inserted token summary
 *
 * @throws {Error} Raw database errors:
 * - Foreign key violations (user_id, session_id)
 * - Unique constraint violations (token_hash)
 * - Partial unique index violations (session_id + token_type)
 * - Other database-level failures
 */
const insertToken = async (token, client) => {
  const context = 'token-repository/insertToken';
  
  const {
    userId,
    sessionId = null,
    tokenType,
    tokenHash,
    expiresAt,
    context: tokenContext = null,
  } = token;
  
  const queryText = `
    INSERT INTO tokens (
      user_id,
      session_id,
      token_type,
      token_hash,
      expires_at,
      context
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING
      id,
      user_id,
      session_id,
      token_type,
      issued_at,
      expires_at,
      is_revoked;
  `;
  
  const params = [
    userId,
    sessionId,
    tokenType,
    tokenHash,
    expiresAt,
    tokenContext,
  ];
  
  try {
    const { rows } = await query(queryText, params, client);
    
    logSystemInfo('Token inserted successfully', {
      context,
      tokenId: rows[0]?.id,
      userId,
      tokenType,
      sessionId,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to insert token', {
      context,
      userId,
      tokenType,
      sessionId,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * @typedef {Object} TokenRow
 * @property {string} id
 * @property {string} user_id
 * @property {string|null} session_id
 * @property {string} token_type
 * @property {Date} issued_at
 * @property {Date} expires_at
 * @property {boolean} is_revoked
 */

/**
 * Fetches a token row by its hash.
 *
 * Repository-layer function:
 * - Executes a single SELECT
 * - Returns token row or null
 * - Does NOT enforce auth semantics
 * - Preserves raw database errors
 *
 * @param {string} tokenHash
 * @param {Object|null} client
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   session_id: string | null,
 *   token_type: string,
 *   issued_at: Date,
 *   expires_at: Date,
 *   is_revoked: boolean
 * } | null>}
 */
const getTokenByHash = async (tokenHash, client = null) => {
  const context = 'token-repository/getTokenByHash';
  
  const queryText = `
    SELECT
      id,
      user_id,
      session_id,
      token_type,
      issued_at,
      expires_at,
      is_revoked
    FROM tokens
    WHERE token_hash = $1
    LIMIT 1;
  `;
  
  try {
    const { rows } = await query(queryText, [tokenHash], client);
    
    if (!rows[0]) {
      return null;
    }
    
    logSystemInfo('Token fetched by hash', {
      context,
      tokenId: rows[0].id,
      tokenType: rows[0].token_type,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch token by hash', {
      context,
      tokenHash,
      error: error.message,
    });
    
    throw error;
  }
};

/**
 * Revokes active tokens for a user.
 *
 * Repository-layer function:
 * - Operates ONLY on the `tokens` table
 * - Supports optional token type filtering
 * - Executes a bounded bulk UPDATE
 * - Idempotent (safe to call multiple times)
 * - Does NOT enforce business policy
 * - Preserves raw database errors
 *
 * Semantics:
 * - Marks matching non-revoked tokens as revoked
 * - Does NOT modify session lifecycle fields
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string|null} [options.tokenType] - Optional token type filter (e.g. 'refresh')
 * @param {Object|null} client - Transaction client
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   token_type: string
 * }>>}
 *   Array of revoked token identifiers (empty if none were updated)
 *
 * @throws {Error}
 *   Raw database errors are propagated to the caller
 */
const revokeTokensByUserId = async (
  userId,
  { tokenType = null } = {},
  client = null
) => {
  const context = 'token-repository/revokeTokensByUserId';
  
  const sql = `
    UPDATE tokens
    SET is_revoked = true
    WHERE user_id = $1
      AND is_revoked = false
      ${tokenType ? 'AND token_type = $2' : ''}
    RETURNING id, token_type;
  `;
  
  const params = tokenType ? [userId, tokenType] : [userId];
  
  try {
    const { rows } = await query(sql, params, client);
    
    logSystemInfo('Tokens revoked for user', {
      context,
      userId,
      tokenType,
      revokedCount: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to revoke tokens for user', {
      context,
      userId,
      tokenType,
    });
    throw error;
  }
};

/**
 * Revokes a token by ID.
 *
 * Repository guarantees:
 * - Safe to call multiple times (idempotent)
 * - Performs a single bounded UPDATE
 * - No validation or business logic
 *
 * Semantics:
 * - Marks the token as revoked
 * - Does NOT affect session state
 *
 * @param {string} tokenId
 * @param {Object|null} client
 *
 * @returns {Promise<boolean>} true if token was revoked, false if already revoked
 */
const revokeTokenById = async (tokenId, client = null) => {
  const context = 'token-repository/revokeTokenById';
  
  const sql = `
    UPDATE tokens
    SET
      is_revoked = TRUE,
      updated_at = NOW()
    WHERE id = $1
      AND is_revoked = FALSE
    RETURNING id;
  `;
  
  try {
    const { rowCount } = await query(sql, [tokenId], client);
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to revoke token', {
      context,
      tokenId,
    });
    throw error;
  }
};

/**
 * Revokes all active tokens associated with a session.
 *
 * Repository-layer function:
 * - Executes a bounded bulk UPDATE
 * - Idempotent (safe to call multiple times)
 * - Does NOT enforce business logic
 * - Does NOT modify session lifecycle fields
 * - Preserves raw database errors
 *
 * Semantics:
 * - Marks all non-revoked tokens under the session as revoked
 * - Updates updated_at timestamp
 *
 * @param {string} sessionId
 * @param {Object|null} client
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   user_id: string,
 *   token_type: string
 * }>>}
 *   Array of revoked token identifiers (empty if none were updated)
 *
 * @throws {Error}
 *   Raw database errors are propagated to the caller
 */
const revokeAllTokensBySessionId = async (sessionId, client = null) => {
  const context = 'token-repository/revokeAllTokensBySessionId';
  
  const sql = `
    UPDATE tokens
    SET
      is_revoked = TRUE,
      updated_at = NOW()
    WHERE session_id = $1
      AND is_revoked = FALSE
    RETURNING id, user_id, token_type;
  `;
  
  try {
    const { rows } = await query(sql, [sessionId], client);
    
    logSystemInfo('Tokens revoked for session', {
      context,
      sessionId,
      revokedCount: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to revoke all tokens for session', {
      context,
      sessionId,
    });
    throw error;
  }
};

module.exports = {
  insertToken,
  getTokenByHash,
  revokeTokensByUserId,
  revokeTokenById,
  revokeAllTokensBySessionId,
};
