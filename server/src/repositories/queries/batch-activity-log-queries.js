/**
 * @file batch-activity-log-queries.js
 * @description SQL column configuration and insert constants for
 * batch-activity-log-repository.js.
 *
 * All values are built once at module load — never recreated per request.
 *
 * Exports:
 *  - BATCH_ACTIVITY_LOG_CHUNK_SIZE        — max rows per bulk insert chunk
 *  - BATCH_ACTIVITY_LOG_COLUMNS           — ordered column list for insert builds
 *  - BATCH_ACTIVITY_LOG_CONFLICT_COLUMNS  — empty — records are append-only
 *  - BATCH_ACTIVITY_LOG_UPDATE_STRATEGIES — empty — no upsert conflict resolution
 */

'use strict';

// Maximum rows per bulk insert — guards against exceeding PostgreSQL's
// parameter limit ($1..$65535) on large payloads.
const BATCH_ACTIVITY_LOG_CHUNK_SIZE = 500;

// Insert column list — order must match the values array in the row map
// inside insertBatchActivityLogsBulk. Do not reorder without updating the call site.
const BATCH_ACTIVITY_LOG_COLUMNS = [
  'batch_registry_id',
  'batch_type',
  'batch_activity_type_id',
  'previous_value',
  'new_value',
  'change_summary',
  'changed_by',
];

// No conflict target — batch activity logs are append-only, never upserted.
const BATCH_ACTIVITY_LOG_CONFLICT_COLUMNS  = [];
const BATCH_ACTIVITY_LOG_UPDATE_STRATEGIES = {};

module.exports = {
  BATCH_ACTIVITY_LOG_CHUNK_SIZE,
  BATCH_ACTIVITY_LOG_COLUMNS,
  BATCH_ACTIVITY_LOG_CONFLICT_COLUMNS,
  BATCH_ACTIVITY_LOG_UPDATE_STRATEGIES,
};
