/**
 * @file validate-token.js
 * @description Service-layer token validation — bridges cryptographic JWT verification
 * and database-level session/token state enforcement.
 *
 * Design intent:
 *  - Access tokens are stateless — only JWT signature and session state are checked,
 *    no database persistence lookup for the token itself.
 *  - Refresh tokens are stateful — full persistence, revocation, and expiry checks
 *    are enforced against the database record.
 *  - Token reuse (presenting a revoked refresh token) triggers full session invalidation
 *    as a security incident, not just a rejection.
 *  - All security-relevant events are written to the token activity log for audit.
 *  - Functions here fail closed — any persistence inconsistency results in rejection.
 *
 * Depends on:
 *  - verifyAccessJwt       (jwt-utils.js)                      — cryptographic JWT verification
 *  - validateSessionState  (validate-session.js)               — session state enforcement
 *  - hashToken             (token-hash.js)                     — token hashing before DB lookup
 *  - getTokenByHash        (token-repository.js)               — token persistence lookup
 *  - revokeSession         (session-lifecycle.js)              — session invalidation on reuse/expiry
 *  - insertTokenActivityLog (token-activity-log-repository.js) — audit log writes
 *  - logSystemWarn         (system-logger.js)                  — security event logging
 */

const { verifyAccessJwt } = require('./jwt-utils');
const { validateSessionState } = require('./validate-session');
const AppError = require('../../utils/AppError');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenByHash } = require('../../repositories/token-repository');
const { revokeSession } = require('../../business/auth/session-lifecycle');
const { logSystemWarn } = require('../logging/system-logger');
const { insertTokenActivityLog } = require('../../repositories/token-activity-log-repository');

/**
 * Validates an access token cryptographically and enforces session state integrity.
 *
 * Validation steps:
 *  1. Verifies JWT signature and expiry via verifyAccessJwt
 *  2. Confirms required payload fields (id, role, sessionId) are present
 *  3. Validates associated session state against the database
 *
 * NOTE:
 *  - Access tokens are stateless — no database persistence lookup is performed
 *    for the token itself. Session state is the persistence check.
 *  - JWT signature verification is handled by verifyAccessJwt before this function
 *    inspects the payload.
 *
 * @param {string}      rawAccessToken - Raw access token string from the client.
 * @param {Object|null} [client=null]  - Optional transaction client.
 * @returns {Promise<{
 *   id:        string,
 *   role:      string,
 *   sessionId: string,
 *   iat:       number,
 *   exp:       number
 * }>} Decoded and validated JWT payload.
 *
 * @throws {AppError} validationError     — If token format is invalid.
 * @throws {AppError} authenticationError — If payload fields are missing or session is invalid.
 */
const validateAccessToken = async (rawAccessToken, client = null) => {
  const payload = verifyAccessJwt(rawAccessToken);
  
  // Verify all expected payload fields are present — a missing field means
  // the token was signed with an incorrect or outdated payload shape
  if (!payload.id || !payload.role || !payload.sessionId) {
    throw AppError.authenticationError('Invalid access token payload.');
  }
  
  await validateSessionState(payload.sessionId, client);
  
  return payload;
};

/**
 * Validates refresh token persistence state and enforces strict rotation policy.
 *
 * Validation steps:
 *  1. Hashes the raw token and looks it up in the database
 *  2. Confirms token type is 'refresh'
 *  3. Detects reuse — revoked token → audit log + full session revocation
 *  4. Detects expiry — expired token → audit log + session revocation
 *
 * Security guarantees:
 *  - Revoked token presentation is treated as a reuse attack and triggers
 *    full session invalidation, not just rejection.
 *  - Expired token presentation also invalidates the session and is audited.
 *  - Token existence is never revealed to the caller on failure.
 *  - Fails closed on any persistence inconsistency.
 *
 * NOTE:
 *  - JWT signature verification must be performed upstream before calling this.
 *  - Designed to run inside a database transaction.
 *
 * @param {string}      refreshToken              - Raw refresh token string.
 * @param {Object}      [options={}]              - Audit context options.
 * @param {string|null} [options.ipAddress=null]  - Client IP address for audit logging.
 * @param {string|null} [options.userAgent=null]  - Client user agent for audit logging.
 * @param {Object|null} [client=null]             - Optional transaction client.
 *
 * @returns {Promise<{
 *   id:          string,
 *   user_id:     string,
 *   session_id:  string | null,
 *   token_type:  'refresh',
 *   issued_at:   Date,
 *   expires_at:  Date,
 *   is_revoked:  boolean
 * }>} Validated token database record.
 *
 * @throws {AppError} refreshTokenError        — If token is missing, invalid, or wrong type.
 * @throws {AppError} authenticationError      — If token reuse is detected (session revoked).
 * @throws {AppError} refreshTokenExpiredError — If token is expired (session revoked).
 */
const validateRefreshTokenState = async (
  refreshToken,
  { ipAddress = null, userAgent = null } = {},
  client = null
) => {
  const context = 'validate-token/validateRefreshTokenState';
  
  if (!refreshToken) {
    throw AppError.refreshTokenError('Refresh token is missing.');
  }
  
  const tokenHash = hashToken(refreshToken);
  const token = await getTokenByHash(tokenHash, client);
  
  if (!token) {
    // Deliberately vague — do not reveal whether the token ever existed
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
  // Reuse Detection — revoked token presented
  // Treat as security incident: audit + full session invalidation
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
  // Expiry Detection — expired token presented
  // Audit the attempt and invalidate the session
  // ------------------------------------------------------------
  if (token.expires_at <= new Date()) {
    // Warn rather than info — expired tokens presented server-side are security-relevant
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
      // Pass audit context so the revocation log is complete
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
