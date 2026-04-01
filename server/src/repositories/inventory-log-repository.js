/**
 * @file inventory-activity-log-repository.js
 * @description Database access layer for inventory activity log records.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from inventory-activity-log-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertInventoryActivityLogs — inserts activity log and audit log records in one call
 */

'use strict';

const { bulkInsert } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logBulkInsertError } = require('../utils/db-logger');
const {
  INVENTORY_ACTIVITY_LOG_COLUMNS,
  INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS,
  INVENTORY_ACTIVITY_LOG_CONFLICT_COLUMNS,
  INVENTORY_ACTIVITY_AUDIT_WAREHOUSE_CONFLICT_COLUMNS,
  INVENTORY_ACTIVITY_AUDIT_LOCATION_CONFLICT_COLUMNS,
} = require('./queries/inventory-activity-log-queries');

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts inventory activity log and audit log records for a batch of log entries.
 *
 * Writes to two tables in sequence:
 *  1. inventory_activity_log        — active log, append-only
 *  2. inventory_activity_audit_log  — immutable audit trail, split by scope
 *
 * Each log entry must have exactly one of warehouse_inventory_id or
 * location_inventory_id — not both, not neither. This is validated before
 * any IO to prevent orphaned activity log records.
 *
 * Audit logs are split into warehouse-scope and location-scope batches
 * because each has a different conflict target column.
 *
 * @param {Array<Object>}  logs   - Validated log entry objects.
 * @param {PoolClient}     client - DB client for transactional context.
 * @param {Object}         meta   - Caller context passed through to bulkInsert for tracing.
 *
 * @returns {Promise<{
 *   insertedActivityCount: number,
 *   insertedAuditCount:    number,
 *   warehouseAuditCount:   number,
 *   locationAuditCount:    number,
 *   activityLogIds:        string[]
 * }|undefined>} Summary of inserted records, or undefined if logs is empty.
 *
 * @throws {AppError} Validation error if any log entry has an invalid scope combination.
 * @throws {AppError} Normalized database error if any insert fails.
 */
const insertInventoryActivityLogs = async (logs, client, meta) => {
  if (!Array.isArray(logs) || logs.length === 0) return;
  
  const context = 'inventory-activity-log-repository/insertInventoryActivityLogs';
  
  // ─── Build Rows ───────────────────────────────────────────────────────────
  
  const activityRows = logs.map((log) => [
    log.warehouse_inventory_id    ?? null,
    log.location_inventory_id     ?? null,
    log.inventory_action_type_id,
    log.adjustment_type_id        ?? null,
    log.order_id                  ?? null,
    log.status_id                 ?? null,
    log.previous_quantity,
    log.quantity_change,
    log.new_quantity,
    log.performed_by,
    log.comments                  ?? null,
    JSON.stringify(log.metadata   ?? {}),
    log.source_type               ?? null,
    log.source_ref_id             ?? null,
  ]);
  
  const auditRows = logs.map((log) => [
    log.warehouse_inventory_id    ?? null,
    log.location_inventory_id     ?? null,
    log.inventory_action_type_id,
    log.previous_quantity,
    log.quantity_change,
    log.new_quantity,
    log.status_id,
    log.performed_by,
    log.comments                  ?? null,
    log.checksum,
    JSON.stringify(log.metadata   ?? {}),
    log.recorded_by               ?? log.performed_by,
    log.inventory_scope           ?? 'warehouse',
  ]);
  
  // ─── Validate Scope ───────────────────────────────────────────────────────
  // Validation is before any IO — a scope violation must not leave an orphaned
  // activity log record with no corresponding audit log.
  
  for (const log of logs) {
    const hasWarehouse = Boolean(log.warehouse_inventory_id);
    const hasLocation  = Boolean(log.location_inventory_id);
    
    if ((hasWarehouse && hasLocation) || (!hasWarehouse && !hasLocation)) {
      throw AppError.validationError(
        'Each log must have exactly one of warehouse_inventory_id or location_inventory_id.',
        { context }
      );
    }
  }
  
  // ─── Validate Row Lengths ─────────────────────────────────────────────────
  
  validateBulkInsertRows(activityRows, INVENTORY_ACTIVITY_LOG_COLUMNS.length);
  validateBulkInsertRows(auditRows, INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS.length);
  
  // ─── Split Audit Rows by Scope ────────────────────────────────────────────
  
  // Warehouse and location audit logs have different unique constraint columns
  // so must be inserted separately with their respective conflict targets.
  const warehouseAuditRows = auditRows.filter((r) => r[0] !== null);
  const locationAuditRows  = auditRows.filter((r) => r[1] !== null);
  
  // ─── Insert ───────────────────────────────────────────────────────────────
  
  try {
    const activityResult = await bulkInsert(
      'inventory_activity_log',
      INVENTORY_ACTIVITY_LOG_COLUMNS,
      activityRows,
      INVENTORY_ACTIVITY_LOG_CONFLICT_COLUMNS,
      {},
      client,
      meta
    );
    
    const activityLogIds = activityResult.map((r) => r.id);
    
    if (warehouseAuditRows.length) {
      await bulkInsert(
        'inventory_activity_audit_log',
        INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS,
        warehouseAuditRows,
        INVENTORY_ACTIVITY_AUDIT_WAREHOUSE_CONFLICT_COLUMNS,
        {},
        client,
        meta,
        ''  // no RETURNING — audit log IDs are not needed by caller
      );
    }
    
    if (locationAuditRows.length) {
      await bulkInsert(
        'inventory_activity_audit_log',
        INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS,
        locationAuditRows,
        INVENTORY_ACTIVITY_AUDIT_LOCATION_CONFLICT_COLUMNS,
        {},
        client,
        meta,
        ''  // no RETURNING — audit log IDs are not needed by caller
      );
    }
    
    return {
      insertedActivityCount: activityRows.length,
      insertedAuditCount:    auditRows.length,
      warehouseAuditCount:   warehouseAuditRows.length,
      locationAuditCount:    locationAuditRows.length,
      activityLogIds,
    };
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert inventory activity logs.',
      meta:    { logCount: logs.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'inventory_activity_log / inventory_activity_audit_log',
        [],           // rows omitted — too large to log across two tables
        logs.length,
        { context }
      ),
    });
  }
};

module.exports = {
  insertInventoryActivityLogs,
};
