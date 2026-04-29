/**
 * @file session-service.js
 * @description Service layer for session and token lifecycle operations.
 *
 * Exports:
 *   - issueSessionWithTokens   – creates a session, signs and persists tokens
 *   - revokeAllSessionsForUser – bulk-revokes all sessions and tokens for a user
 *   - revokeSession            – revokes a single session and its tokens
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 */

'use strict';

const { logSystemInfo } = require('../utils/logging/system-logger');
const { signToken } = require('../utils/auth/jwt-utils');
const {
  insertTokenActivityLog,
} = require('../repositories/token-activity-log-repository');
const {
  insertToken,
  revokeTokensByUserId,
  revokeAllTokensBySessionId,
} = require('../repositories/token-repository');
const { hashToken } = require('../utils/auth/token-hash');
const { getTokenExpiry } = require('../utils/auth/token-expiry');
const {
  insertSession,
  revokeSessionsByUserId,
  revokeSessionRowById,
} = require('../repositories/session-repository');

const CONTEXT = 'session-service';

/**
 * Creates a session, signs access and refresh tokens, persists the refresh
 * token, and records a token activity log entry.
 *
 * The inner try/catch audits token persistence failures before re-throwing —
 * this is the only catch in this function and does not log a system exception.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.roleId
 * @param {string | null} [params.ipAddress=null]
 * @param {string | null} [params.userAgent=null]
 * @param {string | null} [params.deviceId=null]
 * @param {object | null} [params.parsedUserAgent=null]
 * @param {PoolClient} client - Active transaction client.
 * @returns {Promise<{ accessToken: string, refreshToken: string, sessionId: string, refreshTokenId: string }>}
 */
const issueSessionWithTokens = async (
  {
    userId,
    roleId,
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    parsedUserAgent = null,
  },
  client
) => {
  const context = `${CONTEXT}/issueSessionWithTokens`;

  // 1. Create session first — sessionId is required for token signing.
  const session = await insertSession(
    {
      userId,
      expiresAt: getTokenExpiry(true),
      ipAddress,
      userAgent,
      deviceId,
      note: parsedUserAgent ? JSON.stringify(parsedUserAgent) : null,
    },
    client
  );

  if (!session?.id) {
    throw new Error('Session creation failed unexpectedly');
  }

  // 2. Sign tokens with sessionId embedded in payload.
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

  // 3. Hash and persist refresh token.
  const refreshTokenHash = hashToken(refreshToken);
  let refreshTokenRow;

  try {
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

    await insertTokenActivityLog(
      {
        userId,
        tokenId: refreshTokenRow.id,
        eventType: 'generate',
        status: 'success',
        tokenType: 'refresh',
        ipAddress,
        userAgent,
      },
      client
    );
  } catch (error) {
    // Token persistence failed — audit the failure before re-throwing.
    await insertTokenActivityLog(
      {
        userId,
        tokenId: null,
        eventType: 'generate',
        status: 'failure',
        tokenType: 'refresh',
        ipAddress,
        userAgent,
        comments: error.message,
      },
      client
    );

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
};

/**
 * Revokes all active sessions and refresh tokens for a user, recording a
 * token activity log entry for each revoked token.
 *
 * @param {string} userId
 * @param {object} [options={}]
 * @param {string | null} [options.ipAddress=null]
 * @param {string | null} [options.userAgent=null]
 * @param {import('pg').PoolClient | null} [client=null]
 * @returns {Promise<{ revokedSessions: object[], revokedTokens: object[] }>}
 */
const revokeAllSessionsForUser = async (
  userId,
  { ipAddress = null, userAgent = null } = {},
  client = null
) => {
  const context = `${CONTEXT}/revokeAllSessionsForUser`;

  const revokedSessions = await revokeSessionsByUserId(userId, client);

  const revokedTokens = await revokeTokensByUserId(
    userId,
    { tokenType: 'refresh' },
    client
  );

  await Promise.all(
    revokedTokens.map((token) =>
      insertTokenActivityLog(
        {
          userId,
          tokenId: token.id,
          eventType: 'revoke',
          status: 'success',
          tokenType: token.token_type,
          ipAddress,
          userAgent,
        },
        client
      )
    )
  );

  logSystemInfo('All sessions revoked for user', {
    context,
    userId,
    revokedSessionCount: revokedSessions.length,
    revokedTokenCount: revokedTokens.length,
  });

  return { revokedSessions, revokedTokens };
};

/**
 * Revokes a single session and all its associated tokens, recording a token
 * activity log entry for each revoked token.
 *
 * @param {string} sessionId
 * @param {object} [options={}]
 * @param {string | null} [options.ipAddress=null]
 * @param {string | null} [options.userAgent=null]
 * @param {import('pg').PoolClient | null} [client=null]
 * @returns {Promise<object[]>} Array of revoked token rows.
 */
const revokeSession = async (
  sessionId,
  { ipAddress = null, userAgent = null } = {},
  client = null
) => {
  const context = `${CONTEXT}/revokeSession`;

  // 1. Revoke session row — invalidates access tokens via session check.
  await revokeSessionRowById(sessionId, client);

  // 2. Revoke all non-revoked tokens linked to the session.
  const revokedTokens = await revokeAllTokensBySessionId(sessionId, client);

  // 3. Record token-level revocation events for audit purposes.
  await Promise.all(
    revokedTokens.map((token) =>
      insertTokenActivityLog(
        {
          userId: token.user_id,
          tokenId: token.id,
          eventType: 'revoke',
          status: 'success',
          tokenType: token.token_type,
          ipAddress,
          userAgent,
        },
        client
      )
    )
  );

  logSystemInfo('Session revoked successfully', {
    context,
    sessionId,
    revokedTokenCount: revokedTokens.length,
  });

  return revokedTokens;
};

module.exports = {
  issueSessionWithTokens,
  revokeAllSessionsForUser,
  revokeSession,
};
