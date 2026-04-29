/**
 * @file validate-token.js
 * @description Token validation utilities for access and refresh token flows.
 *
 * `validateAccessToken` verifies JWT cryptographic validity and session state.
 * `validateRefreshTokenState` enforces persistence-layer token rules including
 * reuse detection and expiry, treating both as security incidents that trigger
 * session revocation and audit logging.
 */

'use strict';

const { verifyAccessJwt } = require('./jwt-utils');
const { validateSessionState } = require('./validate-session');
const AppError = require('../../utils/AppError');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenByHash } = require('../../repositories/token-repository');
const { revokeSession } = require('../../services/session-service');
const { logSystemWarn } = require('../logging/system-logger');
const {
  insertTokenActivityLog,
} = require('../../repositories/token-activity-log-repository');

const CONTEXT = 'validate-token';

/**
 * Verifies an access token's cryptographic validity, payload shape, and
 * associated session state.
 *
 * A missing payload field indicates the token was signed with an incorrect
 * or outdated payload shape — treated as an authentication failure.
 *
 * @param {string} rawAccessToken - Raw JWT access token string.
 * @param {import('pg').PoolClient | null} [client=null] - Optional transaction client.
 * @returns {Promise<object>} Decoded and validated JWT payload.
 * @throws {AppError} authenticationError if payload is malformed or session is invalid.
 */
const validateAccessToken = async (rawAccessToken, client = null) => {
  const payload = verifyAccessJwt(rawAccessToken);

  // A missing field means the token was signed with an incorrect or outdated
  // payload shape — reject rather than proceeding with incomplete identity.
  if (!payload.id || !payload.role || !payload.sessionId) {
    throw AppError.authenticationError('Invalid access token payload.');
  }

  await validateSessionState(payload.sessionId, client);

  return payload;
};

/**
 * Validates a refresh token's persistence state — checks existence, type,
 * revocation status, and expiry.
 *
 * Reuse and expiry are treated as security incidents: both trigger an audit
 * log entry and full session revocation before throwing.
 *
 * @param {string} refreshToken - Raw refresh token string.
 * @param {object} [options={}]
 * @param {string | null} [options.ipAddress=null] - IP address for audit logging.
 * @param {string | null} [options.userAgent=null] - User agent for audit logging.
 * @param {import('pg').PoolClient | null} [options.client=null] - Optional transaction client.
 * @returns {Promise<object>} Validated token row from the database.
 * @throws {AppError} refreshTokenError if token is missing, invalid, wrong type, or revoked.
 * @throws {AppError} refreshTokenExpiredError if token has expired.
 * @throws {AppError} authenticationError if token reuse is detected.
 */
const validateRefreshTokenState = async (
  refreshToken,
  { ipAddress = null, userAgent = null, client = null } = {}
) => {
  const context = `${CONTEXT}/validateRefreshTokenState`;

  if (!refreshToken) {
    throw AppError.refreshTokenError('Refresh token is missing.');
  }

  const tokenHash = hashToken(refreshToken);
  const token = await getTokenByHash(tokenHash, client);

  if (!token) {
    // Deliberately vague — do not reveal whether the token ever existed.
    throw AppError.refreshTokenError('Refresh token is invalid.');
  }

  if (token.token_type !== 'refresh') {
    logSystemWarn('Non-refresh token used in refresh flow', {
      context,
      tokenId: token.id,
      userId: token.user_id,
      tokenType: token.token_type,
    });

    throw AppError.refreshTokenError('Invalid token type.');
  }

  // ------------------------------------------------------------
  // Reuse detection — revoked token presented.
  // Treat as security incident: audit + full session invalidation.
  // ------------------------------------------------------------
  if (token.is_revoked) {
    logSystemWarn('Refresh token reuse detected', {
      context,
      tokenId: token.id,
      userId: token.user_id,
      sessionId: token.session_id,
    });

    await insertTokenActivityLog(
      {
        userId: token.user_id,
        tokenId: token.id,
        eventType: 'reuse_detected',
        status: 'compromised',
        tokenType: 'refresh',
        ipAddress,
        userAgent,
      },
      client
    );

    if (token.session_id) {
      await revokeSession(token.session_id, { ipAddress, userAgent }, client);
    }

    throw AppError.authenticationError(
      'Refresh token reuse detected. Session has been revoked.'
    );
  }

  // ------------------------------------------------------------
  // Expiry detection — expired token presented.
  // Audit the attempt and invalidate the session.
  // ------------------------------------------------------------
  if (token.expires_at <= new Date()) {
    logSystemWarn('Expired refresh token presented', {
      context,
      tokenId: token.id,
      userId: token.user_id,
      sessionId: token.session_id,
    });

    await insertTokenActivityLog(
      {
        userId: token.user_id,
        tokenId: token.id,
        eventType: 'expired_attempt',
        status: 'failed',
        tokenType: 'refresh',
        ipAddress,
        userAgent,
      },
      client
    );

    if (token.session_id) {
      await revokeSession(token.session_id, { ipAddress, userAgent }, client);
    }

    throw AppError.refreshTokenExpiredError(
      'Refresh token expired. Session has been revoked.'
    );
  }

  return token;
};

module.exports = {
  validateAccessToken,
  validateRefreshTokenState,
};
