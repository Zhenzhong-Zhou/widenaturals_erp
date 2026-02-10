const AppError = require('../../utils/AppError');
const { hashToken } = require('../../utils/auth/token-hash');
const { getTokenByHash } = require('../../repositories/token-repository');

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

// const validateRefreshTokenState = async (rawRefreshToken, client = null) => {
//   const tokenHash = hashToken(rawRefreshToken);
//   const token = await getTokenByHash(tokenHash, client);
//
//   if (!token) {
//     throw AppError.refreshTokenError('Invalid refresh token.');
//   }
//
//   if (token.token_type !== 'refresh') {
//     throw AppError.refreshTokenError('Invalid token type.');
//   }
//
//   if (token.is_revoked) {
//     throw AppError.refreshTokenError('Refresh token revoked.');
//   }
//
//   if (new Date(token.expires_at) <= new Date()) {
//     throw AppError.refreshTokenExpiredError('Refresh token expired.');
//   }
//
//   if (token.session_id) {
//     const session = await getSessionById(token.session_id, client);
//
//     if (!session || session.revoked_at) {
//       throw AppError.sessionRevokedError('Session no longer valid.');
//     }
//   }
//
//   return token;
// };

module.exports = {
  validateAccessTokenState,
};
