const jwt = require('jsonwebtoken');
const { logError } = require('./logger-helper');

const SECRET = process.env.JWT_SECRET;

/**
 * Signs a payload to generate a JWT token.
 *
 * @param {object} payload - The payload to sign.
 * @param {string} expiresIn - Expiration time for the token (e.g., '1h').
 * @returns {string} - The signed JWT token.
 */
const signToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

/**
 * Verifies a JWT token.
 *
 * @param {string} token - The token to verify.
 * @returns {object} - The decoded token payload.
 * @throws {Error} - If the token is invalid or expired.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    logError('Invalid or expired token', error);
    throw new Error('Invalid or expired token');
  }
};

module.exports = { signToken, verifyToken };
