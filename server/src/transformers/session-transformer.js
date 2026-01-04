/**
 * @fileoverview Auth response transformers.
 */

const AppError = require('../utils/AppError');

/**
 * Transforms the login service result into a stable API response.
 *
 * Guarantees:
 * - Only whitelisted fields are returned.
 * - last_login is normalized to an ISO-8601 string or null.
 *
 * @param {Object} result
 * @param {string} result.accessToken
 *   Access token issued after successful authentication.
 * @param {string} result.refreshToken
 *   Refresh token associated with the current authentication session.
 * @param {Date|string|null} result.last_login
 *   Last successful login timestamp.
 *   Maybe a Date object, an ISO-compatible date string, or null.
 *   When provided, it is coerced via `new Date(value)` and serialized
 *   using `toISOString()`.
 *
 * @returns {{
 *   accessToken: string,
 *   refreshToken: string,
 *   lastLogin: string | null
 * }}
 */
const transformLoginResponse = (result) => {
  if (!result || typeof result !== 'object') {
    throw AppError.validationError('Invalid login response payload.');
  }
  
  const { accessToken, refreshToken, last_login } = result;
  
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw AppError.validationError('Invalid token payload.');
  }
  
  const lastLogin =
    last_login == null
      ? null
      : new Date(last_login).toISOString();
  
  return {
    accessToken,
    refreshToken,
    lastLogin,
  };
};

module.exports = {
  transformLoginResponse,
};
