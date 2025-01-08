const jwt = require('jsonwebtoken');
const { logError } = require('./logger-helper');
const { loadEnv } = require('../config/env');

// Load environment and secrets
const { jwtAccessSecret, jwtRefreshSecret } = loadEnv();

/**
 * Signs a payload to generate a JWT token.
 *
 * @param {object} payload - The payload to sign.
 * @param {boolean} [isRefreshToken=false] - Whether to generate a refresh token.
 * @returns {string} - The signed JWT token.
 */
const signToken = (payload, isRefreshToken = false) => {
  const secret = isRefreshToken ? jwtRefreshSecret : jwtAccessSecret;
  const expiresIn = isRefreshToken ? '7d' : '15m'; // 7 days for refresh tokens, 15 minutes for access tokens
  
  if (!secret) {
    throw new Error(`JWT secret is not defined for ${isRefreshToken ? 'refresh' : 'access'} token`);
  }
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} token - The token to verify.
 * @returns {object} - The decoded token payload.
 * @throws {Error} - If the token is invalid or expired.
 */
/**
 * Verifies a JWT and returns the decoded payload.
 *
 * @param {string} token - The JWT to verify.
 * @param {boolean} [isRefresh=false] - Whether to verify a refresh token.
 * @returns {object} - The decoded payload.
 * @throws {Error} - If the token is invalid or expired.
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh ? jwtRefreshSecret : jwtAccessSecret;
    return jwt.verify(token, secret);
  } catch (error) {
    logError(`Invalid or expired ${isRefresh ? 'refresh' : 'access'} token`, error);
    throw new Error(`Invalid or expired ${isRefresh ? 'refresh' : 'access'} token`);
  }
};

module.exports = { signToken, verifyToken };
