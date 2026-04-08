/**
 * @file batch-activity-log-repository.js
 * @description Database access layer for batch activity log records.
 *
 * Follows the established repo pattern:
 *  - Query constants at module scope — never recreated per request
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertBatchActivityLogsBulk — chunked bulk insert for activity log records
 */

'use strict';

const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { bulkInsert } = require('../utils/db/write-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logBulkInsertError } = require('../utils/db-logger');
const {
  BATCH_ACTIVITY_LOG_COLUMNS,
  BATCH_ACTIVITY_LOG_CONFLICT_COLUMNS,
  BATCH_ACTIVITY_LOG_UPDATE_STRATEGIES,
  BATCH_ACTIVITY_LOG_CHUNK_SIZE
} = require('./queries/batch-activity-log-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Bulk inserts batch activity log records in chunks.
 *
 * Splits the input into chunks of {@link BATCH_ACTIVITY_LOG_CHUNK_SIZE} to
 * avoid exceeding PostgreSQL's parameter limit on large inserts.
 * Records are append-only — no conflict resolution is applied.
 *
 * @param {Array<Object>} activityLogs          - Activity log objects to insert.
 * @param {PoolClient}      client                - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} All inserted log records across all chunks.
 * @throws  {AppError}               Normalized database error if any chunk fails.
 */
const insertBatchActivityLogsBulk = async (activityLogs, client) => {
  if (!Array.isArray(activityLogs) || activityLogs.length === 0) return [];
  
  const context = 'batch-activity-log-repository/insertBatchActivityLogsBulk';
  
  const insertedResults = [];
  
  try {
    for (let i = 0; i < activityLogs.length; i += BATCH_ACTIVITY_LOG_CHUNK_SIZE) {
      const chunk = activityLogs.slice(i, i + BATCH_ACTIVITY_LOG_CHUNK_SIZE);
      
      const rows = chunk.map((log) => [
        log.batch_registry_id,
        log.batch_type,
        log.batch_activity_type_id,
        log.previous_value  ?? null,
        log.new_value       ?? null,
        log.change_summary  ?? null,
        log.changed_by      ?? null,
      ]);
      
      validateBulkInsertRows(rows, BATCH_ACTIVITY_LOG_COLUMNS.length);
      
      const result = await bulkInsert(
        'batch_activity_logs',
        BATCH_ACTIVITY_LOG_COLUMNS,
        rows,
        BATCH_ACTIVITY_LOG_CONFLICT_COLUMNS,
        BATCH_ACTIVITY_LOG_UPDATE_STRATEGIES,
        client,
        { meta: context },
        'id'
      );
      
      insertedResults.push(...result);
    }
    
    return insertedResults;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert batch activity log records.',
      meta:    { logCount: activityLogs.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'batch_activity_logs',
        [],             // rows omitted — too large to log across chunks
        activityLogs.length,
        {
          context,
          conflictColumns: BATCH_ACTIVITY_LOG_CONFLICT_COLUMNS,
        }
      ),
    });
  }
};

module.exports = {
  insertBatchActivityLogsBulk,
};
