const { verifyAccessJwt } = require('./jwt-utils');
const { validateSessionState } = require('./validate-session');
const AppError = require('../../utils/AppError');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenByHash } = require('../../repositories/token-repository');
const { revokeSession } = require('../../business/auth/session-lifecycle');
const { logSystemWarn, logSystemInfo } = require('../system-logger');
const { insertTokenActivityLog } = require('../../repositories/token-activity-log-repository');

/**
 * Validates an access token and enforces session state integrity.
 *
 * Service-layer function:
 * - Performs cryptographic JWT verification
 * - Ensures required payload fields exist
 * - Validates associated session state
 * - Does NOT check persistence of access tokens (stateless by design)
 *
 * @param {string} rawAccessToken - The raw access token string
 * @param {Object|null} client - Optional transaction client
 *
 * @returns {Promise<{
 *   id: string,
 *   role: string,
 *   sessionId: string,
 *   iat: number,
 *   exp: number
 * }>} Decoded and validated JWT payload
 *
 * @throws {AppError.validationError}
 *   If token format is invalid
 *
 * @throws {AppError.authenticationError}
 *   If token payload is malformed or session is invalid
 */
const validateAccessToken = async (rawAccessToken, client = null) => {
  const payload = verifyAccessJwt(rawAccessToken);
  
  if (!payload.sessionId) {
    throw AppError.authenticationError('Invalid access token payload.');
  }
  
  await validateSessionState(payload.sessionId, client);
  
  return payload;
};

/**
 * Validates refresh token persistence state and enforces strict rotation policy.
 *
 * Guarantees (on success):
 * - Token exists in the database
 * - Token type is `refresh`
 * - Token is not expired
 * - Token has not been revoked
 *
 * Security behavior:
 * - Presentation of a revoked refresh token is treated as reuse and
 *   triggers full session invalidation.
 * - Presentation of an expired refresh token invalidates the session.
 * - All reuse or expiry attempts are recorded in the token activity log.
 * - This function fails closed on any persistence inconsistency.
 *
 * Operational notes:
 * - Designed to run inside a transaction.
 * - Does NOT perform JWT signature validation (handled earlier).
 * - Does NOT expose internal token state to callers.
 *
 * @param {string} refreshToken - Raw refresh token string.
 * @param {string|null} ipAddress - Client IP address for audit logging.
 * @param {string|null} userAgent - Client user agent for audit logging.
 * @param {Object|null} [client] - Optional transaction client.
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   session_id: string | null,
 *   token_type: 'refresh',
 *   issued_at: Date,
 *   expires_at: Date,
 *   is_revoked: boolean
 * }>}
 *
 * @throws {AppError}
 * - refreshTokenError
 * - refreshTokenExpiredError
 * - authenticationError
 */
const validateRefreshTokenState = async (
  refreshToken,
  {
    ipAddress = null,
    userAgent = null,
  } = {},
  client = null
) => {
  const context = 'validate-token/validateRefreshTokenState';
  
  if (!refreshToken) {
    throw AppError.refreshTokenError('Refresh token is missing.');
  }
  
  const tokenHash = hashToken(refreshToken);
  const token = await getTokenByHash(tokenHash, client);
  
  if (!token) {
    // Do not reveal whether token ever existed
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
  // Reuse Detection (Revoked Token)
  // ------------------------------------------------------------
  if (token.is_revoked) {
    logSystemWarn('Refresh token reuse detected', {
      context,
      tokenId: token.id,
      userId: token.user_id,
      sessionId: token.session_id,
    });
    
    // Record security incident in token activity log
    await insertTokenActivityLog({
      userId: token.user_id,
      tokenId: token.id,
      eventType: 'reuse_detected',
      status: 'compromised',
      tokenType: 'refresh',
      ipAddress,
      userAgent,
    }, client);
    
    if (token.session_id) {
      await revokeSession(token.session_id, client);
    }
    
    throw AppError.authenticationError(
      'Refresh token reuse detected. Session has been revoked.'
    );
  }
  
  // ------------------------------------------------------------
  // Expiry Detection
  // ------------------------------------------------------------
  if (token.expires_at <= new Date()) {
    logSystemInfo('Expired refresh token presented', {
      context,
      tokenId: token.id,
      userId: token.user_id,
      sessionId: token.session_id,
    });
    
    // Audit expired refresh token attempt
    await insertTokenActivityLog({
      userId: token.user_id,
      tokenId: token.id,
      eventType: 'expired_attempt',
      status: 'failed',
      tokenType: 'refresh',
      ipAddress,
      userAgent,
    }, client);
    
    if (token.session_id) {
      await revokeSession(token.session_id, client);
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
