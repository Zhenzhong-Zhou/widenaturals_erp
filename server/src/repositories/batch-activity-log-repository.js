const { bulkInsert } = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/system-logger');

/**
 * Bulk insert batch activity log records into the `batch_activity_logs` table.
 *
 * This repository function performs a batch insert of activity log entries
 * associated with batch registry events such as creation, updates, quantity
 * adjustments, status changes, or other lifecycle actions.
 *
 * Each log entry captures the previous and new values of the batch state,
 * along with metadata describing the change and the actor responsible.
 *
 * The function uses the shared `bulkInsert` utility to efficiently insert
 * multiple records within an optional database transaction.
 *
 * Implementation Notes:
 * - Inserts records in chunks (default size: 500) to prevent oversized SQL
 *   payloads and improve stability for large batch operations.
 *
 * Logging:
 * - Emits a system info log on successful insertion
 * - Emits a system exception log if the operation fails
 *
 * Error Handling:
 * - Wraps database errors using `AppError.databaseError` to ensure
 *   consistent error handling across the service layer.
 *
 * @async
 * @function insertBatchActivityLogsBulk
 *
 * @param {Array<Object>} activityLogs - List of batch activity log entries to insert.
 * @param {string} activityLogs[].batch_registry_id - UUID of the associated batch registry record.
 * @param {string} activityLogs[].batch_type - Type of batch entity (e.g., `product_batch`, `packaging_material_batch`).
 * @param {string} activityLogs[].batch_activity_type_id - Identifier of the batch activity type.
 * @param {Object|null} [activityLogs[].previous_value] - Previous state snapshot of the batch.
 * @param {Object|null} [activityLogs[].new_value] - New state snapshot after the change.
 * @param {string|null} [activityLogs[].change_summary] - Human-readable description of the change.
 * @param {string|null} [activityLogs[].changed_by] - User ID or system identifier responsible for the change.
 *
 * @param {Object} [client] - Optional PostgreSQL transaction client.
 *
 * @returns {Promise<Array<{id: string}>>}
 * Returns an array of inserted records containing the generated `id` values.
 *
 * @throws {AppError}
 * Throws `AppError.databaseError` if the insert operation fails.
 */
const DEFAULT_BATCH_INSERT_CHUNK_SIZE = 500;

const insertBatchActivityLogsBulk = async (activityLogs, client) => {
  if (!Array.isArray(activityLogs) || activityLogs.length === 0) return [];
  
  const context = 'batch-activity-log-repository/insertBatchActivityLogsBulk';
  
  const columns = [
    'batch_registry_id',
    'batch_type',
    'batch_activity_type_id',
    'previous_value',
    'new_value',
    'change_summary',
    'changed_by',
  ];
  
  const conflictColumns = [];
  const updateStrategies = {};
  
  try {
    const insertedResults = [];
    
    for (let i = 0; i < activityLogs.length; i += DEFAULT_BATCH_INSERT_CHUNK_SIZE) {
      const chunk = activityLogs.slice(i, i + DEFAULT_BATCH_INSERT_CHUNK_SIZE);
      
      const rows = chunk.map((log) => [
        log.batch_registry_id,
        log.batch_type,
        log.batch_activity_type_id,
        log.previous_value ?? null,
        log.new_value ?? null,
        log.change_summary ?? null,
        log.changed_by ?? null,
      ]);
      
      const result = await bulkInsert(
        'batch_activity_logs',
        columns,
        rows,
        conflictColumns,
        updateStrategies,
        client,
        { context },
        'id'
      );
      
      insertedResults.push(...result);
    }
    
    logSystemInfo('Successfully inserted batch activity log records', {
      context,
      insertedCount: insertedResults.length,
      totalInput: activityLogs.length,
      chunks: Math.ceil(activityLogs.length / DEFAULT_BATCH_INSERT_CHUNK_SIZE),
    });
    
    return insertedResults;
  } catch (error) {
    logSystemException(error, 'Failed to insert batch activity log records', {
      context,
      logCount: activityLogs.length,
    });
    
    throw AppError.databaseError('Failed to insert batch activity log records', {
      cause: error,
    });
  }
};

module.exports = {
  insertBatchActivityLogsBulk,
};
