/**
 * @file batch-activity-type-repository.js
 * @description Database access layer for batch activity type records.
 *
 * Follows the established repo pattern:
 *  - Query constants at module scope — never recreated per request
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getBatchActivityTypes — fetches all active batch activity type records
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  BATCH_ACTIVITY_TYPE_SELECT,
} = require('./queries/batch-activity-type-queries');

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all active batch activity types.
 *
 * Used to resolve activity type codes during batch lifecycle logging.
 * Only active records are returned — inactive types are retired codes
 * no longer valid for new batch operations.
 *
 * @param {PoolClient|null} [client=null] - Optional DB client for transactional context.
 *
 * @returns {Promise<Array<BatchActivityTypeRow>>} Active batch activity type records.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getBatchActivityTypes = async (client = null) => {
  const context = 'batch-activity-type-repository/getBatchActivityTypes';

  try {
    const result = await query(BATCH_ACTIVITY_TYPE_SELECT, [], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to retrieve batch activity types.',
      meta: { table: 'batch_activity_types' },
      logFn: (err) =>
        logDbQueryError(BATCH_ACTIVITY_TYPE_SELECT, [], err, { context }),
    });
  }
};

module.exports = {
  getBatchActivityTypes,
};
