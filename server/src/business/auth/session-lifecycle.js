const { signToken } = require('../../utils/auth/jwt-utils');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenExpiry } = require('../../utils/auth/token-expiry');
const {
  insertSession,
  revokeSessionsByUserId,
  revokeSessionRowById
} = require('../../repositories/session-repository');
const {
  insertToken,
  revokeTokensByUserId,
  revokeAllTokensBySessionId
} = require('../../repositories/token-repository');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');

/**
 * Issues a new authenticated session and its access/refresh tokens.
 *
 * Responsibilities:
 * - Creates a new session whose lifetime is aligned with the refresh token
 * - Issues and persists access + refresh tokens atomically
 * - Ensures token material is never stored in plaintext
 *
 * Transactional contract:
 * - This function MUST be invoked within an existing database transaction
 * - No commit or rollback is performed internally
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user identifier
 * @param {string} params.roleId - Role identifier embedded in JWT payload
 * @param {string|null} [params.ipAddress] - Client IP address (optional)
 * @param {string|null} [params.userAgent] - Client user agent (optional)
 * @param {string|null} [params.deviceId] - Client device identifier (optional)
 * @param {string|null} [params.note] - Optional session note or metadata
 *
 * @param {Object} client - Active database transaction client
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   sessionId: string,
 *   accessTokenId: string,
 *   refreshTokenId: string
 * }>}
 *
 * Notes:
 * - Returned identifiers are INTERNAL and must not be exposed to clients
 * - Callers are responsible for audit logging and transport concerns
 *
 * @throws {Error} Propagates repository or cryptographic errors
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
  const context = 'auth-business/issueSessionWithTokens';
  
  try {
    // ------------------------------------------------------------
    // 1. Sign tokens (stateless)
    // ------------------------------------------------------------
    const accessToken = signToken({ id: userId, role: roleId });
    const refreshToken = signToken(
      { id: userId, role: roleId },
      true
    );
    
    // ------------------------------------------------------------
    // 2. Hash tokens once
    // ------------------------------------------------------------
    const accessTokenHash = hashToken(accessToken);
    const refreshTokenHash = hashToken(refreshToken);
    
    // ------------------------------------------------------------
    // 3. Create session (refresh-token–anchored lifetime)
    // ------------------------------------------------------------
    const session = await insertSession(
      {
        userId,
        sessionTokenHash: accessTokenHash,
        expiresAt: getTokenExpiry(true),
        ipAddress,
        userAgent,
        deviceId,
        note,
      },
      client
    );
    
    // ------------------------------------------------------------
    // 4. Persist tokens
    // ------------------------------------------------------------
    const accessTokenRow = await insertToken(
      {
        userId,
        sessionId: session.id,
        tokenType: 'access',
        tokenHash: accessTokenHash,
        expiresAt: getTokenExpiry(false),
        context: 'login',
      },
      client
    );
    
    const refreshTokenRow = await insertToken(
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
    
    logSystemInfo('Session and tokens issued successfully', {
      context,
      userId,
      sessionId: session.id,
    });
    
    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      accessTokenId: accessTokenRow.id,
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
 * Revokes all active sessions and related tokens for a user.
 *
 * Business guarantees:
 * - Orchestrates multi-table revocation (sessions + tokens)
 * - Enforces revocation policy (refresh tokens only)
 * - Executes atomically when called within a transaction
 *
 * @param {string} userId
 * @param {Object|null} client
 *
 * @returns {Promise<{
 *   revokedSessions: number,
 *   revokedTokens: number
 * }>}
 *
 * @throws {Error} Propagates repository errors
 */
const revokeAllSessionsForUser = async (userId, client = null) => {
  const context = 'auth-business/revokeAllSessionsForUser';
  
  try {
    const revokedSessions = await revokeSessionsByUserId(userId, client);
    
    const revokedTokens = await revokeTokensByUserId(
      userId,
      { tokenType: 'refresh' },
      client
    );
    
    logSystemInfo('All sessions revoked for user', {
      context,
      userId,
      revokedSessions,
      revokedTokens,
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
    throw error; // DO NOT wrap — preserve original failure
  }
};

/**
 * Fully revokes a session and all associated tokens.
 *
 * BUSINESS INVARIANT:
 * - A revoked session MUST NOT have active tokens.
 * - These operations must remain coupled.
 *
 * @param {string} sessionId
 * @param {Object|null} client
 */
const revokeSession = async (sessionId, client = null) => {
  const context = 'session-service/revokeSession';
  
  try {
    await revokeSessionRowById(sessionId, client);
    await revokeAllTokensBySessionId(sessionId, client);
  } catch (error) {
    logSystemException(error, 'Failed to revoke session', {
      context,
      sessionId,
    });
    throw error;
  }
};

module.exports = {
  issueSessionWithTokens,
  revokeAllSessionsForUser,
  revokeSession,
};
