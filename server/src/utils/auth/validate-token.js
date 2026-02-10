const AppError = require('../../utils/AppError');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenByHash } = require('../../repositories/token-repository');
const { revokeSession } = require('../../business/auth/session-lifecycle');

/**
 * Validates access token state against persistence.
 *
 * Guarantees:
 * - Token exists
 * - Token is not revoked
 * - Token is not expired
 *
 * @param {string} rawAccessToken
 * @param {Object|null} client
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   session_id: string,
 *   expires_at: Date
 * }>}
 */
const validateAccessTokenState = async (rawAccessToken, client = null) => {
  const tokenHash = hashToken(rawAccessToken);
  const token = await getTokenByHash(tokenHash, client);
  
  if (!token) {
    throw AppError.accessTokenError('Token is invalid.');
  }
  
  if (token.is_revoked) {
    throw AppError.accessTokenError('Token has been revoked.');
  }
  
  if (token.expires_at <= new Date()) {
    throw AppError.accessTokenExpiredError('Access token expired.');
  }
  
  return token;
};

/**
 * Validates refresh token persistence state.
 *
 * Guarantees (on success):
 * - Token exists in the database
 * - Token type is `refresh`
 * - Token is not expired
 * - Token has not been revoked
 *
 * Security behavior:
 * - If a revoked refresh token is presented, this is treated as
 *   refresh-token reuse and the associated session is revoked.
 *
 * @param {string} refreshToken - Raw refresh token string
 * @param {Object|null} [client] - Optional transaction client
 *
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   session_id: string | null,
 *   token_type: 'access' | 'refresh',
 *   issued_at: Date,
 *   expires_at: Date,
 *   is_revoked: boolean
 * }>}
 *
 * @throws {AppError}
 */
const validateRefreshTokenState = async (refreshToken, client = null) => {
  if (!refreshToken) {
    throw AppError.refreshTokenError('Refresh token is missing.');
  }
  
  const tokenHash = hashToken(refreshToken);
  const token = await getTokenByHash(tokenHash, client);
  
  if (!token) {
    throw AppError.refreshTokenError('Refresh token is invalid.');
  }
  
  if (token.token_type !== 'refresh') {
    throw AppError.refreshTokenError('Invalid token type.');
  }
  
  if (token.is_revoked) {
    // Refresh token reuse detected
    await revokeSession(token.session_id, client);
    
    throw AppError.authenticationError(
      'Refresh token reuse detected. Session has been revoked.'
    );
  }
  
  if (token.expires_at <= new Date()) {
    throw AppError.refreshTokenExpiredError('Refresh token expired.');
  }
  
  return token;
};

module.exports = {
  validateAccessTokenState,
  validateRefreshTokenState,
};
