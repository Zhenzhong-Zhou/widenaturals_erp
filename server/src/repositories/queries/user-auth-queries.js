/**
 * @file user-auth-queries.js
 * @description SQL query constants for user-auth-repository.js.
 *
 * Exports:
 *  - INSERT_USER_AUTH_QUERY                        — insert a new user_auth row
 *  - GET_AND_LOCK_USER_AUTH_BY_EMAIL_QUERY         — fetch and row-lock auth by email
 *  - GET_AND_LOCK_USER_AUTH_BY_USER_ID_QUERY       — fetch and row-lock auth by user id
 *  - INCREMENT_FAILED_ATTEMPTS_QUERY               — increment failed attempts and conditionally set lockout
 *  - RESET_FAILED_ATTEMPTS_AND_UPDATE_LOGIN_QUERY  — reset failed attempts and stamp last_login
 *  - UPDATE_PASSWORD_AND_HISTORY_QUERY             — update password hash and history metadata
 */

'use strict';

// $1: user_id, $2: password_hash
const INSERT_USER_AUTH_QUERY = `
  INSERT INTO user_auth (
    user_id,
    password_hash
  )
  VALUES ($1, $2)
`;

// $1: email, $2: active_status_id
// FOR UPDATE OF ua — row-locks the auth record for the transaction
const GET_AND_LOCK_USER_AUTH_BY_EMAIL_QUERY = `
  SELECT
    u.id            AS user_id,
    u.email,
    u.role_id,
    ua.id           AS auth_id,
    ua.password_hash,
    ua.last_login,
    ua.attempts,
    ua.failed_attempts,
    ua.lockout_time
  FROM users u
  JOIN user_auth ua ON ua.user_id = u.id
  WHERE u.email = $1
    AND u.status_id = $2
  FOR UPDATE OF ua
`;

// $1: user_id
// FOR UPDATE OF ua — row-locks the auth record for the transaction
const GET_AND_LOCK_USER_AUTH_BY_USER_ID_QUERY = `
  SELECT
    u.id            AS user_id,
    u.email,
    u.role_id,
    ua.id           AS auth_id,
    ua.password_hash,
    ua.last_login,
    ua.attempts,
    ua.failed_attempts,
    ua.lockout_time,
    ua.metadata
  FROM users u
  JOIN user_auth ua ON ua.user_id = u.id
  WHERE u.id = $1
  FOR UPDATE OF ua
`;

// $1: new_total_attempts, $2: new_failed_attempts, $3: lockout_time,
// $4: lockout_time (jsonb lastLockout), $5: notes, $6: auth_id
const INCREMENT_FAILED_ATTEMPTS_QUERY = `
  UPDATE user_auth
  SET
    attempts        = $1,
    failed_attempts = $2,
    lockout_time    = $3,
    metadata        = jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'),
        '{lastLockout}',
        to_jsonb($4::timestamp),
        true
      ),
      '{notes}',
      to_jsonb($5::text),
      true
    ),
    updated_at      = NOW()
  WHERE id = $6
`;

// $1: new_total_attempts, $2: auth_id
const RESET_FAILED_ATTEMPTS_AND_UPDATE_LOGIN_QUERY = `
  UPDATE user_auth
  SET
    attempts        = $1,
    failed_attempts = 0,
    lockout_time    = NULL,
    last_login      = NOW(),
    metadata        = jsonb_set(
      COALESCE(metadata, '{}'),
      '{lastSuccessfulLogin}',
      to_jsonb(NOW()::timestamp),
      true
    ),
    updated_at      = NOW()
  WHERE id = $2
`;

// $1: new_password_hash, $2: updated_history (jsonb), $3: auth_id
const UPDATE_PASSWORD_AND_HISTORY_QUERY = `
  UPDATE user_auth
  SET
    password_hash = $1,
    metadata      = jsonb_set(
      COALESCE(metadata, '{}'),
      '{password_history}',
      $2::jsonb
    ),
    updated_at    = NOW()
  WHERE id = $3
  RETURNING id
`;

module.exports = {
  INSERT_USER_AUTH_QUERY,
  GET_AND_LOCK_USER_AUTH_BY_EMAIL_QUERY,
  GET_AND_LOCK_USER_AUTH_BY_USER_ID_QUERY,
  INCREMENT_FAILED_ATTEMPTS_QUERY,
  RESET_FAILED_ATTEMPTS_AND_UPDATE_LOGIN_QUERY,
  UPDATE_PASSWORD_AND_HISTORY_QUERY,
};
