/**
 * @file token-activity-log-repository.js
 * @description Database access layer for token activity log records.
 *
 * Fire-and-forget pattern — errors are caught and logged but never re-thrown.
 * A logging failure must never propagate up and crash the auth flow that
 * triggered it.
 *
 * Exports:
 *  - insertTokenActivityLog — insert a token activity log row
 */

'use strict';

const { query } = require('../database/db');
const { logSystemException } = require('../utils/logging/system-logger');
const { INSERT_TOKEN_ACTIVITY_LOG_QUERY } = require('./queries/token-activity-log-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts a token activity log row.
 *
 * Errors are swallowed — activity logging is fire-and-forget and must not
 * propagate failures back to the auth flow.
 *
 * @param {Object}                  event
 * @param {string}                  event.userId       - UUID of the acting user.
 * @param {string|null}             [event.tokenId]    - UUID of the associated token.
 * @param {string}                  event.eventType    - Event type identifier.
 * @param {string}                  event.status       - Outcome status of the event.
 * @param {string}                  event.tokenType    - Token type involved.
 * @param {string|null}             [event.ipAddress]  - Client IP address.
 * @param {string|null}             [event.userAgent]  - Client user agent string.
 * @param {string|null}             [event.comments]   - Optional free-text notes.
 * @param {Object|null}             [event.metadata]   - Optional structured metadata.
 * @param {PoolClient} client             - Transaction client.
 *
 * @returns {Promise<void>}
 */
const insertTokenActivityLog = async (event, client) => {
  const context = 'token-activity-log-repository/insertTokenActivityLog';
  
  const {
    userId,
    tokenId   = null,
    eventType,
    status,
    tokenType,
    ipAddress = null,
    userAgent = null,
    comments  = null,
    metadata  = null,
  } = event;
  
  const params = [
    userId,
    tokenId,
    eventType,
    status,
    tokenType,
    ipAddress,
    userAgent,
    comments,
    metadata,
  ];
  
  try {
    await query(INSERT_TOKEN_ACTIVITY_LOG_QUERY, params, client);
  } catch (error) {
    // Swallow — activity logging must never crash the auth flow.
    logSystemException(error, 'Failed to insert token activity log', {
      context,
      userId,
      tokenId,
      eventType,
      status,
    });
  }
};

module.exports = {
  insertTokenActivityLog,
};
