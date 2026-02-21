const { query } = require('../../database/db');
const { logSystemException } = require('../../utils/system-logger');
const AppError = require('../../utils/AppError');

/**
 * Executes a boolean existence query.
 *
 * Designed for repository-layer usage to standardize:
 * - Error handling
 * - Logging
 * - AppError wrapping
 * - Boolean result semantics
 *
 * The provided SQL should follow the pattern:
 *   SELECT 1 FROM ... WHERE ... LIMIT 1
 *
 * @param {string} queryText - Parameterized SQL query.
 * @param {Array<any>} params - Query parameter values.
 * @param {string} context - Logging context identifier.
 * @param {string} logMessage - Human-readable failure message.
 * @param {import('pg').PoolClient|null} [client] - Optional transactional client.
 *
 * @returns {Promise<boolean>}
 *   Returns true if at least one row exists, false otherwise.
 *
 * @throws {AppError.databaseError}
 *   If query execution fails.
 */
const existsQuery = async (
  queryText,
  params,
  context,
  logMessage,
  client = null
) => {
  try {
    const { rowCount } = await query(queryText, params, client);
    return rowCount > 0;
  } catch (error) {
    logSystemException(error, logMessage, { context });
    
    throw AppError.databaseError(logMessage, {
      cause: error,
      context,
    });
  }
};

module.exports = {
  existsQuery,
};
