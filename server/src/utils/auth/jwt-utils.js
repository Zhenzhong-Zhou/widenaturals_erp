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
      secretName: isRefreshToken ? 'JWT_REFRESH_SECRET' : 'JWT_ACCESS_SECRET',
    });

    throw AppError.serviceError('JWT secret not configured');
  }

  const ttlSeconds = getTtlSeconds(
    isRefreshToken ? 'REFRESH_TOKEN_TTL_SECONDS' : 'ACCESS_TOKEN_TTL_SECONDS'
  );

  return jwt.sign(payload, secret, {
    expiresIn: `${ttlSeconds}s`,
  });
};

/**
 * Performs a lightweight structural check to determine
 * whether a token resembles a JWT.
 *
 * Security utility:
 * - Ensures token is a string
 * - Ensures token has exactly 3 dot-separated segments
 * - Does NOT verify signature
 * - Does NOT validate expiry
 *
 * @param {string} token
 * @returns {boolean} True if token appears structurally valid
 */
const isLikelyJwt = (token) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
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

/**
 * Verifies an access token cryptographically.
 *
 * Security-layer function:
 * - Performs lightweight format validation
 * - Verifies JWT signature and expiry
 * - Does NOT validate session state
 * - Does NOT check persistence or revocation
 *
 * @param {string} token - Raw access token
 *
 * @returns {object} Decoded JWT payload
 *
 * @throws {AppError.validationError}
 *   If token format is invalid
 *
 * @throws {AppError.authenticationError}
 *   If signature verification fails or token is expired
 */
const verifyAccessJwt = (token) => {
  if (!isLikelyJwt(token)) {
    throw AppError.validationError('Invalid token format');
  }

  return verifyToken(token, false);
};

/**
 * Verifies a refresh token cryptographically.
 *
 * Security-layer function:
 * - Performs lightweight format validation
 * - Verifies JWT signature and expiry
 * - Does NOT validate persistence state
 * - Does NOT enforce session revocation rules
 *
 * @param {string} token - Raw refresh token
 *
 * @returns {object} Decoded JWT payload
 *
 * @throws {AppError.validationError}
 *   If token format is invalid
 *
 * @throws {AppError.authenticationError}
 *   If signature verification fails or token is expired
 */
const verifyRefreshJwt = (token) => {
  if (!isLikelyJwt(token)) {
    throw AppError.validationError('Invalid token format');
  }

  return verifyToken(token, true);
};

module.exports = {
  getTtlSeconds,
  getTtlMs,
  signToken,
  isLikelyJwt,
  verifyToken,
  verifyAccessJwt,
  verifyRefreshJwt,
};
