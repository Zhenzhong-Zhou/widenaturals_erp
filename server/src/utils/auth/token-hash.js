const crypto = require('crypto');

const TOKEN_HASH_ALGORITHM = 'sha256';
const TOKEN_HASH_ENCODING = 'hex';

/**
 * Hashes an authentication token for secure database storage.
 *
 * SECURITY DESIGN:
 * - Uses a fast cryptographic hash (SHA-256) because tokens are already
 *   high-entropy (unlike passwords).
 * - Applies a server-side pepper to protect against database-only compromise.
 * - Produces a deterministic hash suitable for indexing and lookup.
 *
 * IMPORTANT:
 * - Raw tokens MUST NEVER be stored or logged.
 * - This function is for persistence only, NOT for verification.
 * - Token revocation and expiry checks are handled separately.
 *
 * FAILURE BEHAVIOR:
 * - Throws a plain Error (not AppError) because missing configuration
 *   represents a deployment error and should fail fast.
 *
 * @param {string} token - Raw JWT or opaque authentication token
 * @returns {string} Hex-encoded token hash
 *
 * @throws {Error} If token is invalid or PASSWORD_PEPPER is misconfigured
 */
const hashToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }
  
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) {
    throw new Error('PASSWORD_PEPPER is not configured');
  }
  
  return crypto
    .createHash(TOKEN_HASH_ALGORITHM)
    .update(`${token}.${pepper}`)
    .digest(TOKEN_HASH_ENCODING);
};

module.exports = {
  hashToken,
};
