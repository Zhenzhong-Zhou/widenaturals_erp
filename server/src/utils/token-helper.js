const jwt = require('jsonwebtoken');
const { logError } = require('./logger-helper');
const AppError = require('./AppError');

/**
 * Signs a payload to generate a JWT token.
 *
 * @param {object} payload - The payload to sign.
 * @param {boolean} [isRefreshToken=false] - Whether to generate a refresh token.
 * @returns {string} - The signed JWT token.
 * @throws {AppError} - If the secret is not defined.
 */
const signToken = (payload, isRefreshToken = false) => {
  const secret = isRefreshToken
    ? process.env.JWT_REFRESH_SECRET
    : process.env.JWT_ACCESS_SECRET;
  const expiresIn = isRefreshToken ? '7d' : '15m'; // 7 days for refresh tokens, 15 minutes for access tokens

  if (!secret) {
    throw AppError.serviceError(
      `JWT secret is not defined for ${isRefreshToken ? 'refresh' : 'access'} token`,
      { details: { isRefreshToken } }
    );
  }

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies a JWT and returns the decoded payload.
 *
 * @param {string} token - The JWT to verify.
 * @param {boolean} [isRefresh=false] - Whether to verify a refresh token.
 * @returns {object} - The decoded payload.
 * @throws {AppError} - If the token is invalid or expired.
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw AppError.serviceError(
        `JWT secret is not defined for ${isRefresh ? 'refresh' : 'access'} token`,
        { details: { isRefresh } }
      );
    }

    return jwt.verify(token, secret);
  } catch (error) {
    logError(
      `Invalid or expired ${isRefresh ? 'refresh' : 'access'} token`,
      error
    );
    throw AppError.authenticationError(
      `Invalid or expired ${isRefresh ? 'refresh' : 'access'} token`,
      { details: { error: error.message } }
    );
  }
};

module.exports = { signToken, verifyToken };
