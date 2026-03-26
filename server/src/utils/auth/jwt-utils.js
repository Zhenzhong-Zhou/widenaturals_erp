/**
 * @file jwt-utils.js
 * @description JWT signing, verification, and TTL configuration utilities.
 *
 * Design intent:
 *  - Tokens are signed with separate secrets for access and refresh — compromise
 *    of one secret does not affect the other.
 *  - TTL is always derived from environment variables — no hardcoded expiry anywhere.
 *  - Verification is split into access/refresh variants so callers never need to
 *    pass a boolean flag directly.
 *  - This file handles cryptographic validation only — token revocation and session
 *    state must be enforced separately at the database layer.
 *
 * Security rules enforced here:
 *  - Raw tokens must never be stored or logged (enforced by convention, not code)
 *  - Tokens must be hashed before persisting to the database
 *  - Structural pre-validation (isLikelyJwt) runs before any crypto operation
 *
 * Depends on:
 *  - jsonwebtoken            — signing and verification
 *  - AppError                — structured domain error creation
 *  - logSystemError          (system-logger.js) — unexpected error logging
 */

const jwt = require('jsonwebtoken');
const AppError = require('../AppError');
const { logSystemError } = require('../logging/system-logger');

/**
 * Reads a TTL value in seconds from environment variables.
 *
 * Intentionally throws a plain Error (not AppError) to crash the process
 * on startup if configuration is missing — this is a config-level failure,
 * not a recoverable runtime error.
 *
 * @param {string} envKey - Environment variable name (e.g. 'ACCESS_TOKEN_TTL_SECONDS').
 * @returns {number} TTL in seconds.
 * @throws {Error} If the env variable is missing, zero, or not a valid number.
 */
const getTtlSeconds = (envKey) => {
  const value = Number(process.env[envKey]);
  
  if (!value || Number.isNaN(value) || value <= 0) {
    throw new Error(`${envKey} is not configured correctly`);
  }
  
  return value;
};

/**
 * Returns a TTL value in milliseconds for cookie maxAge usage.
 *
 * Delegates validation entirely to getTtlSeconds — no duplicate checks.
 *
 * @param {string} envKey - Environment variable name (e.g. 'ACCESS_TOKEN_TTL_SECONDS').
 * @returns {number} TTL in milliseconds.
 * @throws {Error} If the env variable is missing or invalid (via getTtlSeconds).
 */
const getTtlMs = (envKey) => {
  return getTtlSeconds(envKey) * 1000;
};

/**
 * Signs a JWT access or refresh token.
 *
 * Security guarantees:
 *  - Access and refresh tokens use separate secrets
 *  - TTL is always read from environment (single source of truth)
 *  - Payload is not encrypted — only non-sensitive claims should be included
 *
 * IMPORTANT:
 *  - Tokens MUST be hashed before persisting to the database
 *  - Raw tokens MUST NEVER be stored or logged
 *
 * @param {object}  payload                  - JWT payload (non-sensitive claims only).
 * @param {boolean} [isRefreshToken=false]   - Pass true to sign a refresh token.
 * @returns {string} Signed JWT string.
 * @throws {AppError} If the JWT secret is missing or misconfigured.
 * @throws {Error}    If the TTL environment variable is invalid.
 */
const signToken = (payload, isRefreshToken = false) => {
  const secretKey = isRefreshToken ? 'JWT_REFRESH_SECRET' : 'JWT_ACCESS_SECRET';
  const ttlKey    = isRefreshToken ? 'REFRESH_TOKEN_TTL_SECONDS' : 'ACCESS_TOKEN_TTL_SECONDS';
  const secret    = process.env[secretKey];
  
  if (!secret) {
    logSystemError('JWT secret missing', {
      context: 'signToken',
      secretName: secretKey,
    });
    
    throw AppError.serviceError('JWT secret not configured');
  }
  
  const ttlSeconds = getTtlSeconds(ttlKey);
  
  return jwt.sign(payload, secret, { expiresIn: `${ttlSeconds}s` });
};

/**
 * Performs a lightweight structural check to determine if a value resembles a JWT.
 *
 * Checks:
 *  - Value is a string
 *  - Has exactly 3 non-empty dot-separated segments (header.payload.signature)
 *
 * Does NOT verify signature or expiry — use verifyToken for cryptographic validation.
 *
 * @param {string} token - Value to check.
 * @returns {boolean} True if the value looks structurally like a JWT.
 */
const isLikelyJwt = (token) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
};

/**
 * Verifies a JWT and returns its decoded payload.
 *
 * Verification guarantees:
 *  - Signature validated against the correct secret
 *  - Expiry enforced via JWT `exp` claim
 *  - Domain-specific AppErrors thrown for expired and invalid tokens
 *
 * NOTE:
 *  - Does NOT check token revocation — database-level validation must be done separately
 *  - AppErrors thrown inside the try block (e.g. missing secret) are intentionally
 *    re-thrown before the catch handles them, so they are not swallowed as generalError
 *
 * @param {string}  token             - Raw JWT string.
 * @param {boolean} [isRefresh=false] - Pass true when verifying a refresh token.
 * @returns {object} Decoded JWT payload.
 * @throws {AppError} For expired tokens, invalid tokens, or missing secrets.
 */
const verifyToken = (token, isRefresh = false) => {
  const secret = isRefresh
    ? process.env.JWT_REFRESH_SECRET
    : process.env.JWT_ACCESS_SECRET;
  
  // Check secret before entering try/catch so misconfiguration isn't swallowed
  if (!secret) {
    throw AppError.serviceError('JWT secret not configured');
  }
  
  try {
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
    
    // Unexpected error (e.g. malformed secret, internal jwt failure)
    logSystemError('Unexpected JWT verification error', {
      context: 'verifyToken',
      error,
    });
    
    throw AppError.generalError('Token verification failed');
  }
};

/**
 * Verifies an access token cryptographically.
 *
 * Security-layer function:
 *  - Performs lightweight format validation before crypto operations
 *  - Verifies JWT signature and expiry
 *  - Does NOT validate session state or revocation
 *
 * @param {string} token - Raw access token from client.
 * @returns {object} Decoded JWT payload.
 * @throws {AppError} If token format is invalid, signature fails, or token is expired.
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
 *  - Performs lightweight format validation before crypto operations
 *  - Verifies JWT signature and expiry
 *  - Does NOT validate persistence state or session revocation
 *
 * @param {string} token - Raw refresh token from client.
 * @returns {object} Decoded JWT payload.
 * @throws {AppError} If token format is invalid, signature fails, or token is expired.
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
