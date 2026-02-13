const { query } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Inserts a login event into `login_history`.
 *
 * Repository-layer function:
 * - Executes a single INSERT
 * - Best-effort logging only
 * - Must NEVER break login flow
 *
 * @param {Object} entry
 * @param {Object} client
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
  
  const queryText = `
    INSERT INTO login_history (
      user_id,
      session_id,
      token_id,
      auth_action_type_id,
      status,
      ip_address,
      user_agent
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7);
  `;
  
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
    await query(queryText, params, client);
    
    logSystemInfo('Login history recorded', {
      context,
      userId,
      sessionId,
      status,
    });
  } catch (error) {
    logSystemException(error, 'Failed to insert login history', {
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
