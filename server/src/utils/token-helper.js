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
    logError(
      `JWT secret is missing for ${isRefreshToken ? 'refresh' : 'access'} token.`
    );
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
 * @throws {AppError} - Specific errors based on the issue with the token.
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      logError(
        `JWT secret is missing for ${isRefresh ? 'refresh' : 'access'} token.`
      );
      throw AppError.serviceError(
        `JWT secret is not defined for ${isRefresh ? 'refresh' : 'access'} token`,
        { details: { isRefresh } }
      );
    }

    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Handle token expiration
      const errorType = isRefresh
        ? AppError.refreshTokenExpiredError
        : AppError.accessTokenExpiredError;

      throw errorType(
        `${isRefresh ? 'Refresh' : 'Access'} token has expired.`,
        { details: { error: error.message } }
      );
    } else if (error.name === 'JsonWebTokenError') {
      // Handle invalid token (e.g., tampered or malformed)
      const errorType = isRefresh
        ? AppError.refreshTokenError
        : AppError.accessTokenError;

      throw errorType(`Invalid ${isRefresh ? 'refresh' : 'access'} token.`, {
        details: { error: error.message },
      });
    }

    // Handle unexpected errors
    logError(
      `Unexpected error verifying ${isRefresh ? 'refresh' : 'access'} token.`,
      error
    );
    throw AppError.generalError(
      `Unexpected error verifying ${isRefresh ? 'refresh' : 'access'} token.`,
      { details: { error: error.message } }
    );
  }
};

module.exports = { signToken, verifyToken };
