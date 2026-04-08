/**
 * @file token-queries.js
 * @description SQL query constants for token-repository.js.
 *
 * Exports:
 *  - INSERT_TOKEN_QUERY                 — insert a new token row
 *  - GET_TOKEN_BY_HASH_QUERY            — fetch a token row by hash
 *  - REVOKE_TOKEN_BY_ID_QUERY           — revoke a single token by id
 *  - REVOKE_ALL_TOKENS_BY_SESSION_QUERY — revoke all tokens for a session
 *  - buildRevokeTokensByUserQuery       — factory for user-scoped revocation
 */

'use strict';

const INSERT_TOKEN_QUERY = `
  INSERT INTO tokens (
    user_id,
    session_id,
    token_type,
    token_hash,
    expires_at,
    context
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING
    id,
    user_id,
    session_id,
    token_type,
    issued_at,
    expires_at,
    is_revoked
`;

const GET_TOKEN_BY_HASH_QUERY = `
  SELECT
    id,
    user_id,
    session_id,
    token_type,
    issued_at,
    expires_at,
    is_revoked
  FROM tokens
  WHERE token_hash = $1
  LIMIT 1
`;

// $1: token_id
const REVOKE_TOKEN_BY_ID_QUERY = `
  UPDATE tokens
  SET
    is_revoked = TRUE,
    updated_at = NOW()
  WHERE id = $1
    AND is_revoked = FALSE
  RETURNING id
`;

// $1: session_id
const REVOKE_ALL_TOKENS_BY_SESSION_QUERY = `
  UPDATE tokens
  SET
    is_revoked = TRUE,
    updated_at = NOW()
  WHERE session_id = $1
    AND is_revoked = FALSE
  RETURNING id, user_id, token_type
`;

/**
 * Builds the revocation query for a user with an optional token_type filter.
 *
 * Returns both the query string and the correctly ordered params array so the
 * caller does not need to conditionally build params separately.
 *
 * @param {string}      userId    - UUID of the user whose tokens to revoke.
 * @param {string|null} tokenType - If provided, restricts revocation to this type.
 *
 * @returns {{ sql: string, params: Array }}
 */
const buildRevokeTokensByUserQuery = (userId, tokenType) => ({
  sql: `
    UPDATE tokens
    SET is_revoked = TRUE
    WHERE user_id = $1
      AND is_revoked = FALSE
      ${tokenType ? 'AND token_type = $2' : ''}
    RETURNING id, token_type
  `,
  params: tokenType ? [userId, tokenType] : [userId],
});

module.exports = {
  INSERT_TOKEN_QUERY,
  GET_TOKEN_BY_HASH_QUERY,
  REVOKE_TOKEN_BY_ID_QUERY,
  REVOKE_ALL_TOKENS_BY_SESSION_QUERY,
  buildRevokeTokensByUserQuery,
};
