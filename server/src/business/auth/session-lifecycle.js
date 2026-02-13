const { signToken } = require('../../utils/auth/jwt-utils');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenExpiry } = require('../../utils/auth/token-expiry');
const {
  insertSession,
  revokeSessionsByUserId,
  revokeSessionRowById,
  logoutSessionRowById
} = require('../../repositories/session-repository');
const {
  insertToken,
  revokeTokensByUserId,
  revokeAllTokensBySessionId
} = require('../../repositories/token-repository');
const { insertTokenActivityLog } = require('../../repositories/token-activity-log-repository');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { insertLoginHistory } = require('../../repositories/login-history-repository');
const { getStatusId } = require('../../config/status-cache');
const { withTransaction } = require('../../database/db');

/**
 * Issues a new authenticated session and its access/refresh tokens.
 *
 * Guarantees (on success):
 * - A new session row is created and linked to the authenticated user
 * - Access and refresh tokens are generated with the session identifier
 * - Only hashed refresh tokens are persisted
 * - Token generation and persistence occur atomically within the provided transaction
 *
 * Responsibilities:
 * - Create session aligned with refresh-token lifetime
 * - Sign access and refresh tokens
 * - Persist refresh token hash
 * - Emit token-generation audit logs
 *
 * Transactional contract:
 * - MUST be invoked within an active database transaction
 * - Does NOT commit or rollback internally
 * - Any thrown error will cause the caller’s transaction to roll back
 *
 * Security properties:
 * - No plaintext tokens are persisted
 * - Internal identifiers (sessionId, refreshTokenId) must not be exposed externally
 * - Fails closed on any persistence or cryptographic error
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.roleId
 * @param {string|null} [params.ipAddress]
 * @param {string|null} [params.userAgent]
 * @param {string|null} [params.deviceId]
 * @param {string|null} [params.note]
 *
 * @param {Object} client - Active transaction client
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   sessionId: string,
 *   refreshTokenId: string
 * }>}
 *
 * @throws {Error}
 */
const issueSessionWithTokens = async (
  {
    userId,
    roleId,
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    note = null,
  },
  client
) => {
  const context = 'session-lifecycle/issueSessionWithTokens';
  
  try {
    // ------------------------------------------------------------
    // 1. Create session FIRST
    // ------------------------------------------------------------
    const session = await insertSession(
      {
        userId,
        expiresAt: getTokenExpiry(true),
        ipAddress,
        userAgent,
        deviceId,
        note,
      },
      client
    );
    
    if (!session?.id) {
      throw new Error('Session creation failed unexpectedly');
    }
    
    // ------------------------------------------------------------
    // 2. Sign tokens WITH sessionId
    // ------------------------------------------------------------
    const accessToken = signToken({
      id: userId,
      role: roleId,
      sessionId: session.id,
    });
    
    const refreshToken = signToken(
      {
        id: userId,
        sessionId: session.id,
        jti: crypto.randomUUID(),
      },
      true
    );
    
    // ------------------------------------------------------------
    // 3. Hash refresh token
    // ------------------------------------------------------------
    const refreshTokenHash = hashToken(refreshToken);
    
    // ------------------------------------------------------------
    // 4. Persist refresh token
    // ------------------------------------------------------------
    let refreshTokenRow;
    
    try {
      // Persist refresh token
      refreshTokenRow = await insertToken(
        {
          userId,
          sessionId: session.id,
          tokenType: 'refresh',
          tokenHash: refreshTokenHash,
          expiresAt: getTokenExpiry(true),
          context: 'login',
        },
        client
      );
      
      // Success log
      await insertTokenActivityLog({
        userId,
        tokenId: refreshTokenRow.id,
        eventType: 'generate',
        status: 'success',
        tokenType: 'refresh',
        ipAddress,
        userAgent,
      }, client);
      
    } catch (error) {
      // Only token persistence failure logged here
      await insertTokenActivityLog({
        userId,
        tokenId: null,
        eventType: 'generate',
        status: 'failure',
        tokenType: 'refresh',
        ipAddress,
        userAgent,
        comments: error.message,
      }, client);
      
      throw error;
    }
    
    logSystemInfo('Session and tokens issued successfully', {
      context,
      userId,
      sessionId: session.id,
    });
    
    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      refreshTokenId: refreshTokenRow.id,
    };
  } catch (error) {
    logSystemException(error, 'Failed to issue session with tokens', {
      context,
      userId,
    });
    throw error;
  }
};

/**
 * Revokes all active sessions and associated refresh tokens for a user.
 *
 * Guarantees (on success):
 * - All non-revoked sessions for the user are marked revoked
 * - All non-revoked refresh tokens linked to those sessions are revoked
 * - Token revocations are recorded in the token activity log
 *
 * Responsibilities:
 * - Coordinate multi-table revocation (sessions + refresh tokens)
 * - Enforce session invalidation policy
 * - Emit structured revocation audit logs
 *
 * Transactional contract:
 * - Executes atomically when invoked within an active transaction
 * - Does NOT commit or rollback internally
 *
 * Security properties:
 * - Access tokens are invalidated indirectly via session revocation
 * - No plaintext tokens are exposed
 *
 * @param {string} userId - Target user identifier
 * @param {Object} [metadata]
 * @param {string|null} [metadata.ipAddress]
 * @param {string|null} [metadata.userAgent]
 * @param {Object|null} client - Optional transaction client
 *
 * @returns {Promise<{
 *   revokedSessions: Array,
 *   revokedTokens: Array
 * }>}
 *
 * @throws {Error}
 */
const revokeAllSessionsForUser = async (
  userId,
  {
    ipAddress = null,
    userAgent = null,
  } = {},
  client = null
) => {
  const context = 'session-lifecycle/revokeAllSessionsForUser';
  
  try {
    const revokedSessions = await revokeSessionsByUserId(userId, client);
    
    const revokedTokens = await revokeTokensByUserId(
      userId,
      { tokenType: 'refresh' },
      client
    );
    
    await Promise.all(
      revokedTokens.map((token) =>
        insertTokenActivityLog({
          userId,
          tokenId: token.id,
          eventType: 'revoke',
          status: 'success',
          tokenType: token.token_type,
          ipAddress,
          userAgent,
        }, client)
      )
    );
    
    logSystemInfo('All sessions revoked for user', {
      context,
      userId,
      revokedSessionCount: revokedSessions.length,
      revokedTokenCount: revokedTokens.length,
    });
    
    return {
      revokedSessions,
      revokedTokens,
    };
  } catch (error) {
    logSystemException(error, 'Failed to revoke all sessions for user', {
      context,
      userId,
    });
    throw error;
  }
};

/**
 * Fully revokes a session and all associated tokens.
 *
 * Guarantees (on success):
 * - The session row is marked revoked
 * - All non-revoked tokens linked to the session are revoked
 * - Token-level revocations are recorded in the activity log
 *
 * Business invariant:
 * - A revoked session MUST NOT have active tokens
 * - Session and token revocation must remain coupled
 *
 * Transactional contract:
 * - Executes atomically when invoked within a transaction
 * - Does NOT commit or rollback internally
 *
 * Security properties:
 * - Access tokens become invalid via session revocation
 * - Refresh tokens are explicitly revoked
 *
 * @param {string} sessionId - Target session identifier
 * @param {Object} [metadata]
 * @param {string|null} [metadata.ipAddress]
 * @param {string|null} [metadata.userAgent]
 * @param {Object|null} client - Optional transaction client
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   user_id: string,
 *   token_type: string
 * }>>}
 *   Array of tokens revoked during this operation.
 *
 * @throws {Error} Propagates repository errors
 */
const revokeSession = async (
  sessionId,
  {
    ipAddress = null,
    userAgent = null,
  } = {},
  client = null
) => {
  const context = 'session-lifecycle/revokeSession';
  
  try {
    // 1. Revoke session row (invalidates access tokens via session check)
    await revokeSessionRowById(sessionId, client);
    
    // 2. Revoke all non-revoked tokens linked to the session
    const revokedTokens = await revokeAllTokensBySessionId(
      sessionId,
      client
    );
    
    // 3. Record token-level revocation events for audit purposes
    await Promise.all(
      revokedTokens.map((token) =>
        insertTokenActivityLog({
          userId: token.user_id,
          tokenId: token.id,
          eventType: 'revoke',
          status: 'success',
          tokenType: token.token_type,
          ipAddress,
          userAgent,
        }, client)
      )
    );
    
    logSystemInfo('Session revoked successfully', {
      context,
      sessionId,
      revokedTokenCount: revokedTokens.length,
    });
    
    return revokedTokens;
  } catch (error) {
    logSystemException(error, 'Failed to revoke session', {
      context,
      sessionId,
    });
    throw error;
  }
};

/**
 * Logs out a session and revokes all associated tokens.
 *
 * Guarantees (on success):
 * - Session is marked as logged out
 * - All active tokens linked to the session are revoked
 * - Logout event is recorded in login history
 * - Token-level revocations are recorded in token activity log
 *
 * Business invariants:
 * - A logged-out session MUST NOT have active tokens
 * - Logout represents explicit user intent (not security revocation)
 * - Token revocation is mandatory and coupled to logout
 *
 * Transactional contract:
 * - Should be executed within a database transaction
 * - Does NOT commit or rollback internally
 * - Idempotent by design
 *
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 *
 * @returns {Promise<{
 *   sessionId: string,
 *   revokedTokenCount: number
 * }|null>}
 */
const logoutSession = async ({
                               sessionId,
                               ipAddress,
                               userAgent
}) => {
  const context = 'session-lifecycle/logoutSession';
  
  return withTransaction(async (client) => {
    try {
      // 1. Mark session as logged out (idempotent)
      const session = await logoutSessionRowById(sessionId, client);
      
      if (!session) {
        return null; // Already logged out or not found
      }
      
      // 2. Revoke all active tokens linked to this session
      const revokedTokens = await revokeAllTokensBySessionId(
        sessionId,
        client
      );
      
      // 3. Record explicit logout event
      await insertLoginHistory({
        userId: session.user_id,
        sessionId,
        tokenId: null,
        authActionTypeId: getStatusId('logout'),
        status: 'success',
        ipAddress,
        userAgent,
      }, client);
      
      // 4. Record token-level revocation events
      await Promise.all(
        revokedTokens.map((token) =>
          insertTokenActivityLog({
            userId: token.user_id,
            tokenId: token.id,
            eventType: 'revoke',
            status: 'success',
            tokenType: token.token_type,
            ipAddress,
            userAgent,
          }, client)
        )
      );
      
      logSystemInfo('Session logged out successfully', {
        context,
        sessionId,
        revokedTokenCount: revokedTokens.length,
      });
      
      return {
        sessionId,
        revokedTokenCount: revokedTokens.length,
      };
    } catch (error) {
      logSystemException(error, 'Failed to log out session', {
        context,
        sessionId,
      });
      throw error;
    }
  });
};

module.exports = {
  issueSessionWithTokens,
  revokeAllSessionsForUser,
  revokeSession,
  logoutSession,
};
