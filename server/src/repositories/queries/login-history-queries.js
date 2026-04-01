/**
 * @file login-history-queries.js
 * @description SQL query constants for login-history-repository.js.
 *
 * Exports:
 *  - LOGIN_HISTORY_INSERT — insert a single login history record
 */

'use strict';

// Append-only — no RETURNING needed, caller does not use the inserted ID.
const LOGIN_HISTORY_INSERT = `
  INSERT INTO login_history (
    user_id,
    session_id,
    token_id,
    auth_action_type_id,
    status,
    ip_address,
    user_agent
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`;

module.exports = {
  LOGIN_HISTORY_INSERT,
};
