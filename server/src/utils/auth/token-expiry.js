/**
 * @file token-expiry.js
 * @description Computes absolute token expiry timestamps from environment TTL configuration.
 *
 * Design intent:
 *  - Single source of truth for token expiry calculation — all token creation
 *    paths use this function rather than computing expiry inline.
 *  - TTL is always read from environment variables via getTtlSeconds, keeping
 *    expiry policy consistent with JWT signing configuration.
 *  - Pure and deterministic — no side effects, no logging, no error handling beyond
 *    what getTtlSeconds provides.
 *
 * Depends on:
 *  - getTtlSeconds (jwt-utils.js) — reads and validates TTL from environment variables
 */

const { getTtlSeconds } = require('./jwt-utils');

/**
 * Computes the absolute expiry timestamp for an access or refresh token.
 *
 * TTL is read from environment variables — the same source used during JWT signing —
 * so expiry timestamps stored in the database always match the JWT exp claim.
 *
 * @param {boolean} [isRefreshToken=false] - Pass true to compute refresh token expiry.
 * @returns {Date} Absolute expiry timestamp.
 * @throws {Error} If the TTL environment variable is missing or invalid.
 */
const getTokenExpiry = (isRefreshToken = false) => {
  const ttlSeconds = getTtlSeconds(
    isRefreshToken ? 'REFRESH_TOKEN_TTL_SECONDS' : 'ACCESS_TOKEN_TTL_SECONDS'
  );

  return new Date(Date.now() + ttlSeconds * 1000);
};

module.exports = {
  getTokenExpiry,
};
