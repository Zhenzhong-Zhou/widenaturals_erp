/**
 * @file login-history-repository.js
 * @description Database access layer for login history records.
 *
 * Login history insert failures are intentionally non-fatal — a failed
 * audit log must not interrupt the authentication flow. Errors are warned
 * and swallowed rather than rethrown.
 *
 * Exports:
 *  - insertLoginHistory — appends a single login history record
 */

'use strict';

const { query } = require('../database/db');
const { logSystemWarn } = require('../utils/logging/system-logger');
const { LOGIN_HISTORY_INSERT } = require('./queries/login-history-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Appends a login history record for audit and session tracking.
 *
 * Failures are intentionally swallowed — a failed audit log must not
 * interrupt the authentication flow. A warning is logged instead.
 *
 * @param {Object}      entry
 * @param {string|null} entry.userId             - UUID of the user, or null for unknown users.
 * @param {string|null} [entry.sessionId=null]   - Session UUID if applicable.
 * @param {string|null} [entry.tokenId=null]     - Token UUID if applicable.
 * @param {string}      entry.authActionTypeId   - UUID of the auth action type.
 * @param {string}      entry.status             - Login attempt status code.
 * @param {string|null} [entry.ipAddress=null]   - Client IP address.
 * @param {string|null} [entry.userAgent=null]   - Client user agent string.
 * @param {PoolClient}  client                   - DB client for transactional context.
 *
 * @returns {Promise<void>}
 */
const insertLoginHistory = async (entry, client) => {
  const context = 'login-history-repository/insertLoginHistory';

  const {
    userId,
    sessionId = null,
    tokenId = null,
    authActionTypeId,
    status,
    ipAddress = null,
    userAgent = null,
  } = entry;

  const params = [
    userId,
    sessionId,
    tokenId,
    authActionTypeId,
    status,
    ipAddress,
    userAgent,
  ];

  try {
    await query(LOGIN_HISTORY_INSERT, params, client);
  } catch (error) {
    // Login history is a non-fatal audit trail — swallow the error to
    // avoid interrupting the auth flow, but warn so it is visible.
    logSystemWarn('Failed to insert login history — audit record skipped', {
      context,
      userId,
      sessionId,
      status,
      error: error.message,
    });
  }
};

module.exports = {
  insertLoginHistory,
};
