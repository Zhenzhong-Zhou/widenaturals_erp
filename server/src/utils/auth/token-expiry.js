const { getTtlSeconds } = require('./jwt-utils');

/**
 * Computes the absolute expiry timestamp for an access or refresh token.
 *
 * DESIGN NOTES:
 * - TTL values are read from environment variables (seconds)
 * - Conversion to milliseconds happens exactly once
 * - This function is pure and deterministic
 *
 * SECURITY:
 * - Expiry policy is centralized and consistent with JWT signing
 * - Configuration errors fail fast via getTtlSeconds
 *
 * @param {boolean} [isRefreshToken=false]
 *   Whether to compute expiry for a refresh token (true) or access token (false)
 *
 * @returns {Date}
 *   Absolute expiry timestamp
 *
 * @throws {Error}
 *   If TTL configuration is missing or invalid
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
