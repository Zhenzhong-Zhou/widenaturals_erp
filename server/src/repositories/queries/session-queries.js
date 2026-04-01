/**
 * @file session-queries.js
 * @description SQL query constants for session-repository.js.
 *
 * Exports:
 *  - SESSION_INSERT_QUERY               — insert new session record
 *  - SESSION_GET_BY_ID_QUERY            — fetch session by id
 *  - SESSION_REVOKE_BY_USER_QUERY       — revoke all active sessions for a user
 *  - SESSION_UPDATE_ACTIVITY_QUERY      — update last_activity_at with throttle guard
 *  - SESSION_REVOKE_BY_ID_QUERY         — revoke single session by id
 *  - SESSION_LOGOUT_BY_ID_QUERY         — logout and revoke single session by id
 */

'use strict';

// $1: user_id, $2: expires_at, $3: ip_address, $4: user_agent,
// $5: device_id, $6: note
const SESSION_INSERT_QUERY = `
  INSERT INTO sessions (
    user_id,
    expires_at,
    ip_address,
    user_agent,
    device_id,
    note
  )
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING
    id,
    user_id,
    created_at,
    last_activity_at,
    expires_at
`;

// $1: session_id (UUID)
const SESSION_GET_BY_ID_QUERY = `
  SELECT
    id,
    user_id,
    expires_at,
    revoked_at,
    logout_at
  FROM sessions
  WHERE id = $1
  LIMIT 1
`;

// Revokes all non-revoked sessions for a user.
// $1: user_id (UUID)
const SESSION_REVOKE_BY_USER_QUERY = `
  UPDATE sessions
  SET revoked_at = NOW()
  WHERE user_id = $1
    AND revoked_at IS NULL
  RETURNING id
`;

// Throttled update — only writes if last_activity_at is null or older
// than 5 minutes to avoid high-frequency writes on active sessions.
// $1: session_id (UUID)
const SESSION_UPDATE_ACTIVITY_QUERY = `
  UPDATE sessions
  SET last_activity_at = NOW()
  WHERE id = $1
    AND revoked_at IS NULL
    AND (
      last_activity_at IS NULL
      OR last_activity_at < NOW() - INTERVAL '5 minutes'
    )
  RETURNING id
`;

// Revokes a single non-revoked session by id.
// $1: session_id (UUID)
const SESSION_REVOKE_BY_ID_QUERY = `
  UPDATE sessions
  SET revoked_at = NOW()
  WHERE id = $1
    AND revoked_at IS NULL
  RETURNING id
`;

// Logs out a session — sets both logout_at and revoked_at if not already set.
// COALESCE preserves existing values if already logged out or revoked.
// $1: session_id (UUID)
const SESSION_LOGOUT_BY_ID_QUERY = `
  UPDATE sessions
  SET
    logout_at  = COALESCE(logout_at,  NOW()),
    revoked_at = COALESCE(revoked_at, NOW())
  WHERE id = $1
    AND logout_at IS NULL
  RETURNING id, user_id
`;

module.exports = {
  SESSION_INSERT_QUERY,
  SESSION_GET_BY_ID_QUERY,
  SESSION_REVOKE_BY_USER_QUERY,
  SESSION_UPDATE_ACTIVITY_QUERY,
  SESSION_REVOKE_BY_ID_QUERY,
  SESSION_LOGOUT_BY_ID_QUERY,
};
