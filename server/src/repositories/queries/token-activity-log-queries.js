/**
 * @file token-activity-log-queries.js
 * @description SQL query constants for token-activity-log-repository.js.
 *
 * Exports:
 *  - INSERT_TOKEN_ACTIVITY_LOG_QUERY — insert a token activity log row
 */

'use strict';

// $1: user_id, $2: token_id, $3: event_type, $4: status, $5: token_type,
// $6: ip_address, $7: user_agent, $8: comments, $9: metadata
const INSERT_TOKEN_ACTIVITY_LOG_QUERY = `
  INSERT INTO token_activity_log (
    user_id,
    token_id,
    event_type,
    status,
    token_type,
    ip_address,
    user_agent,
    comments,
    metadata
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

module.exports = {
  INSERT_TOKEN_ACTIVITY_LOG_QUERY,
};
