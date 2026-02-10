const jwt = require('jsonwebtoken');
const AppError = require('../AppError');
const { logError } = require('../logger-helper');
const { logSystemError } = require('../system-logger');

/**
 * Reads a TTL value (in seconds) from environment variables
 * and fails fast if the configuration is invalid.
 *
 * NOTE:
 * - This is a configuration-level helper, not business logic
 * - It intentionally throws a plain Error to crash on misconfiguration
 *
 * @param {string} envKey
 * @returns {number} TTL in seconds
 */
const getTtlSeconds = (envKey) => {
  const value = Number(process.env[envKey]);
  
  if (!value || Number.isNaN(value)) {
    throw new Error(`${envKey} is not configured correctly`);
  }
  
  return value;
};

/**
 * Returns token TTL in milliseconds for cookie usage.
 *
 * @param {string} envKey
 * @returns {number}
 */
const getTtlMs = (envKey) => {
  const seconds = getTtlSeconds(envKey);
  
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(`${envKey} must be a positive integer (seconds)`);
  }
  
  return seconds * 1000;
};

/**
 * Signs a JWT access or refresh token.
 *
 * Security guarantees:
 * - Uses separate secrets for access and refresh tokens
 * - TTL is derived from environment configuration (single source of truth)
 * - JWT payload is NOT hashed or encrypted
 * - Token confidentiality is enforced by transport + short TTL
 *
 * IMPORTANT:
 * - Tokens MUST be hashed before persisting to database
 * - Raw tokens MUST NEVER be stored or logged
 *
 * @param {object} payload - JWT payload (non-sensitive claims only)
 * @param {boolean} [isRefreshToken=false] - Whether to sign a refresh token
 * @returns {string} Signed JWT
 *
 * @throws {AppError} When JWT secrets are misconfigured
 * @throws {Error} When TTL configuration is invalid
 */
const signToken = (payload, isRefreshToken = false) => {
  const secret = isRefreshToken
    ? process.env.JWT_REFRESH_SECRET
    : process.env.JWT_ACCESS_SECRET;
  
  if (!secret) {
    logSystemError('JWT secret missing', {
      isRefreshToken,
      secretName: isRefreshToken
        ? 'JWT_REFRESH_SECRET'
        : 'JWT_ACCESS_SECRET',
    });
    
    throw AppError.serviceError('JWT secret not configured');
  }
  
  const ttlSeconds = getTtlSeconds(
    isRefreshToken
      ? 'REFRESH_TOKEN_TTL_SECONDS'
      : 'ACCESS_TOKEN_TTL_SECONDS'
  );
  
  return jwt.sign(payload, secret, {
    expiresIn: `${ttlSeconds}s`,
  });
};

/**
 * Verifies a JWT access or refresh token.
 *
 * Verification guarantees:
 * - Signature is validated using the correct secret
 * - Expiry is enforced by JWT `exp`
 * - Domain-specific errors are thrown for expired / invalid tokens
 *
 * NOTE:
 * - This function does NOT check token revocation
 * - Database-level token validation must be performed separately
 *
 * @param {string} token - Raw JWT from client
 * @param {boolean} [isRefresh=false] - Whether this is a refresh token
 * @returns {object} Decoded JWT payload
 *
 * @throws {AppError} For expired or invalid tokens
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_ACCESS_SECRET;
    
    if (!secret) {
      throw AppError.serviceError('JWT secret not configured');
    }
    
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw isRefresh
        ? AppError.refreshTokenExpiredError('Refresh token expired')
        : AppError.accessTokenExpiredError('Access token expired');
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw isRefresh
        ? AppError.refreshTokenError('Invalid refresh token')
        : AppError.accessTokenError('Invalid access token');
    }
    
    logError('Unexpected JWT verification error', error);
    throw AppError.generalError('Token verification failed');
  }
};

module.exports = {
  getTtlSeconds,
  getTtlMs,
  signToken,
  verifyToken,
};
