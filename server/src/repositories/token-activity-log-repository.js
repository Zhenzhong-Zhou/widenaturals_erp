const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Inserts a token activity event into `token_activity_log`.
 *
 * Repository-layer function:
 * - Executes a single INSERT statement
 * - Best-effort logging (MUST NOT break auth flow)
 * - No business logic or validation
 *
 * @param {Object} event
 * @param {Object} client
 */
const insertTokenActivityLog = async (event, client) => {
  const context = 'token-activity-log-repository/insertTokenActivityLog';

  const {
    userId,
    tokenId = null,
    eventType,
    status,
    tokenType,
    ipAddress = null,
    userAgent = null,
    comments = null,
    metadata = null,
  } = event;

  const queryText = `
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
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
  `;

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
    await query(queryText, params, client);

    logSystemInfo('Token activity logged', {
      context,
      userId,
      tokenId,
      eventType,
      status,
    });
  } catch (error) {
    logSystemException(error, 'Failed to insert token activity log', {
      context,
      userId,
      tokenId,
      eventType,
      status,
      error: error.message,
    });
  }
};

module.exports = {
  insertTokenActivityLog,
};
