const { signToken } = require('../../utils/auth/jwt-utils');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenExpiry } = require('../../utils/auth/token-expiry');
const { insertSession } = require('../../repositories/session-repository');
const { insertToken } = require('../../repositories/token-repository');

/**
 * Issues a new session with access and refresh tokens.
 *
 * Responsibilities:
 * - Sign access & refresh JWTs
 * - Create session record (access-token–bound)
 * - Persist hashed tokens
 *
 * All operations must run inside an existing transaction.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.roleId
 * @param {string|null} params.ipAddress
 * @param {string|null} params.userAgent
 * @param {Object} client - DB transaction client
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   sessionId: string
 * }>}
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
  // 3. Create session (access-token–anchored)
  // ------------------------------------------------------------
  const session = await insertSession(
    {
      userId,
      sessionTokenHash: accessTokenHash,
      expiresAt: getTokenExpiry(true), // session lives as long as refresh token
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
  
  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
    accessTokenId: accessTokenRow.id,
    refreshTokenId: refreshTokenRow.id,
  };
};

module.exports = {
  issueSessionWithTokens,
};
