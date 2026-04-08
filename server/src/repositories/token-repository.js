/**
 * @file token-repository.js
 * @description Database access layer for token records.
 *
 * Auth infrastructure pattern — differs from domain repos in two ways:
 *  - Errors are re-thrown raw (no handleDbError wrapping); the auth service
 *    owns error handling and needs the original error, not a normalized wrapper
 *  - Success logging is retained on security-critical operations (insert, fetch)
 *    because these are low-frequency and audit-relevant
 *
 * Exports:
 *  - insertToken                    — insert a new token row
 *  - getTokenByHash                 — fetch a token row by hash
 *  - revokeTokensByUserId           — revoke all (or typed) tokens for a user
 *  - revokeTokenById                — revoke a single token by id
 *  - revokeAllTokensBySessionId     — revoke all tokens for a session
 */

'use strict';

const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/logging/system-logger');
const {
  INSERT_TOKEN_QUERY,
  GET_TOKEN_BY_HASH_QUERY,
  REVOKE_TOKEN_BY_ID_QUERY,
  REVOKE_ALL_TOKENS_BY_SESSION_QUERY,
  buildRevokeTokensByUserQuery,
} = require('./queries/token-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a new token row and returns the created record.
 *
 * @param {Object}                  token
 * @param {string}                  token.userId        - UUID of the owning user.
 * @param {string|null}             [token.sessionId]   - UUID of the associated session.
 * @param {string}                  token.tokenType     - Token type identifier.
 * @param {string}                  token.tokenHash     - Hashed token value.
 * @param {Date|string}             token.expiresAt     - Expiry timestamp.
 * @param {string|null}             [token.context]     - Optional context label.
 * @param {PoolClient} client              - Transaction client.
 *
 * @returns {Promise<Object>} Inserted token row.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const insertToken = async (token, client) => {
  const context = 'token-repository/insertToken';
  
  const {
    userId,
    sessionId    = null,
    tokenType,
    tokenHash,
    expiresAt,
    context: tokenContext = null,
  } = token;
  
  const params = [userId, sessionId, tokenType, tokenHash, expiresAt, tokenContext];
  
  try {
    const { rows } = await query(INSERT_TOKEN_QUERY, params, client);
    
    logSystemInfo('Token inserted successfully', {
      context,
      tokenId:   rows[0]?.id,
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
    });
    throw error;
  }
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches a token row by its hash value.
 *
 * Returns null if no matching token exists.
 *
 * @param {string}                  tokenHash - Hashed token value to look up.
 * @param {PoolClient} [client]  - Optional transaction client.
 *
 * @returns {Promise<TokenRow>} Token row, or null if not found.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const getTokenByHash = async (tokenHash, client = null) => {
  const context = 'token-repository/getTokenByHash';
  
  try {
    const { rows } = await query(GET_TOKEN_BY_HASH_QUERY, [tokenHash], client);
    
    if (!rows[0]) return null;
    
    logSystemInfo('Token fetched by hash', {
      context,
      tokenId:   rows[0].id,
      tokenType: rows[0].token_type,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch token by hash', {
      context,
      tokenHash,
    });
    throw error;
  }
};

// ─── Revoke by User ───────────────────────────────────────────────────────────

/**
 * Revokes all active tokens for a user, optionally filtered by token type.
 *
 * Returns the revoked rows so the caller can inspect what was revoked.
 *
 * @param {string}                  userId
 * @param {Object}                  [options={}]
 * @param {string|null}             [options.tokenType] - If provided, restricts to this type.
 * @param {PoolClient} [client]
 *
 * @returns {Promise<Array<Object>>} Revoked token rows.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const revokeTokensByUserId = async (userId, { tokenType = null } = {}, client = null) => {
  const context = 'token-repository/revokeTokensByUserId';
  
  const { sql, params } = buildRevokeTokensByUserQuery(userId, tokenType);
  
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

// ─── Revoke by Id ─────────────────────────────────────────────────────────────

/**
 * Revokes a single token by id.
 *
 * Returns true if the token was found and revoked, false if it was already
 * revoked or did not exist.
 *
 * @param {string}                  tokenId  - UUID of the token to revoke.
 * @param {PoolClient} [client] - Optional transaction client.
 *
 * @returns {Promise<boolean>}
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const revokeTokenById = async (tokenId, client = null) => {
  const context = 'token-repository/revokeTokenById';
  
  try {
    const { rowCount } = await query(REVOKE_TOKEN_BY_ID_QUERY, [tokenId], client);
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to revoke token', {
      context,
      tokenId,
    });
    throw error;
  }
};

// ─── Revoke by Session ────────────────────────────────────────────────────────

/**
 * Revokes all active tokens associated with a session.
 *
 * Returns the revoked rows so the caller can inspect what was revoked.
 *
 * @param {string}                  sessionId - UUID of the session to revoke tokens for.
 * @param {PoolClient} [client]  - Optional transaction client.
 *
 * @returns {Promise<Array<Object>>} Revoked token rows.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const revokeAllTokensBySessionId = async (sessionId, client = null) => {
  const context = 'token-repository/revokeAllTokensBySessionId';
  
  try {
    const { rows } = await query(REVOKE_ALL_TOKENS_BY_SESSION_QUERY, [sessionId], client);
    
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
