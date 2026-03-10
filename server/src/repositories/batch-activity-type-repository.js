const { query } = require('../database/db');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieve active batch activity types.
 *
 * This repository function fetches the list of active activity types
 * used to classify batch lifecycle events such as creation, updates,
 * quantity adjustments, status changes, or other batch-related actions.
 *
 * The returned activity types are typically used by service or business
 * layers to resolve activity type IDs when recording entries in the
 * `batch_activity_logs` table.
 *
 * Performance:
 * - This query is lightweight and reads from a small lookup table.
 * - Only required columns (`id`, `code`) are selected to minimize payload size.
 *
 * @async
 * @function getBatchActivityTypes
 *
 * @param {Object|null} [client=null] - Optional PostgreSQL transaction client.
 *
 * @returns {Promise<Array<{id: string, code: string}>>}
 * Returns an array of active batch activity type records.
 *
 * @throws {AppError}
 * Throws `AppError.databaseError` if the query execution fails.
 */
const getBatchActivityTypes = async (client = null) => {
  const context =
    'batch-activity-type-repository/getBatchActivityTypes';
  
  // Retrieve only active batch activity types used for batch lifecycle logging
  const sql = `
    SELECT id, code
    FROM batch_activity_types
    WHERE is_active = TRUE
  `;
  
  try {
    const result = await query(sql, [], client);
    
    return result.rows;
  } catch (error) {
    logSystemException(
      error,
      'Failed to retrieve batch activity types',
      { context }
    );
    
    throw AppError.databaseError(
      `Failed to retrieve batch activity types: ${error.message}`
    );
  }
};

module.exports = {
  getBatchActivityTypes,
};