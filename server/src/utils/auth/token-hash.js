/**
 * @file token-hash.js
 * @description Cryptographic hashing of authentication tokens for secure database storage.
 *
 * Design intent:
 *  - Tokens are high-entropy by nature (JWT or cryptographically random), so a fast
 *    hash (SHA-256) is appropriate — bcrypt/argon2 are unnecessary and would add
 *    latency on every request that performs a token lookup.
 *  - A server-side pepper is applied before hashing so that a database-only
 *    compromise cannot brute-force token hashes without also compromising the server.
 *  - Hashes are deterministic so they can be indexed and looked up efficiently.
 *  - Raw tokens are never stored, logged, or returned — only their hashes.
 *
 * Security rules:
 *  - Raw tokens MUST NEVER be stored or logged anywhere in the system.
 *  - This file handles persistence hashing only — token verification and
 *    revocation checks are enforced separately.
 *  - Configuration errors throw plain Errors (not AppError) to fail fast
 *    at startup rather than silently degrading at runtime.
 *
 * Depends on:
 *  - crypto (Node.js built-in) — SHA-256 hashing
 *  - TOKEN_PEPPER env variable — server-side pepper for token hashes
 */

const crypto = require('crypto');

// SHA-256 is appropriate for high-entropy token inputs — unlike passwords,
// tokens are already random enough that a fast hash is safe and avoids
// adding latency to every authenticated request
const TOKEN_HASH_ALGORITHM = 'sha256';
const TOKEN_HASH_ENCODING = 'hex';

/**
 * Hashes a raw authentication token for secure database storage and lookup.
 *
 * Applies a server-side pepper before hashing so that database-level compromise
 * alone is not sufficient to reverse or brute-force token hashes.
 *
 * NOTE:
 *  - Uses TOKEN_PEPPER, not PASSWORD_PEPPER — token and password peppers are
 *    intentionally separate secrets so rotating one does not invalidate the other.
 *  - Produces a deterministic hex string suitable for indexed database lookups.
 *  - This function is for storage only — it does not verify, expire, or revoke tokens.
 *
 * @param {string} token - Raw JWT or opaque authentication token.
 * @returns {string} Hex-encoded SHA-256 hash of the peppered token.
 * @throws {Error} If token is not a non-empty string, or TOKEN_PEPPER is not configured.
 */
const hashToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  const pepper = process.env.TOKEN_PEPPER;
  if (!pepper) {
    throw new Error('TOKEN_PEPPER is not configured');
  }

  return crypto
    .createHash(TOKEN_HASH_ALGORITHM)
    .update(`${token}.${pepper}`)
    .digest(TOKEN_HASH_ENCODING);
};

module.exports = {
  hashToken,
};
