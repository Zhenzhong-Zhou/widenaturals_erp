const { bulkInsert } = require('../database/db');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Inserts bulk inventory activity logs (both active + audit logs) for warehouse inventory.
 *
 * @param {Array<Object>} logs - Array of structured log entries (see a format below).
 * @param {object} client - DB client or transaction instance.
 * @param {Object} meta - Optional metadata for tracing/debugging
 *
 * Each log must include:
 * {
 *   warehouse_inventory_id: UUID,
 *   inventory_action_type_id: UUID,
 *   adjustment_type_id?: UUID,
 *   order_id?: UUID,
 *   status_id?: UUID,
 *   previous_quantity: number,
 *   quantity_change: number,
 *   new_quantity: number,
 *   performed_by: UUID,
 *   comments?: string,
 *   metadata?: object,
 *   source_type?: string,
 *   source_ref_id?: UUID,
 *   recorded_by?: UUID,
 *   inventory_scope: 'warehouse',
 *   status_effective_at?: timestamp,
 *   recorded_at?: timestamp,
 *   checksum: string
 * }
 */
const insertInventoryActivityLogs = async (logs, client, meta) => {
  if (!Array.isArray(logs) || logs.length === 0) return;

  try {
    // === Inventory Activity Log (Active Table) ===
    const activityColumns = [
      'warehouse_inventory_id',
      'location_inventory_id',
      'inventory_action_type_id',
      'adjustment_type_id',
      'order_id',
      'status_id',
      'previous_quantity',
      'quantity_change',
      'new_quantity',
      'performed_by',
      'comments',
      'metadata',
      'source_type',
      'source_ref_id',
    ];

    const activityRows = logs.map((log) => [
      log.warehouse_inventory_id || null,
      log.location_inventory_id || null,
      log.inventory_action_type_id,
      log.adjustment_type_id || null,
      log.order_id || null,
      log.status_id || null,
      log.previous_quantity,
      log.quantity_change,
      log.new_quantity,
      log.performed_by,
      log.comments || null,
      JSON.stringify(log.metadata || {}),
      log.source_type || null,
      log.source_ref_id || null,
    ]);

    await bulkInsert(
      'inventory_activity_log',
      activityColumns,
      activityRows,
      [],
      {},
      client,
      meta
    );

    // === Inventory Activity Audit Log ===
    const auditColumns = [
      'warehouse_inventory_id',
      'location_inventory_id',
      'inventory_action_type_id',
      'previous_quantity',
      'quantity_change',
      'new_quantity',
      'status_id',
      'status_effective_at',
      'action_by',
      'comments',
      'checksum',
      'metadata',
      'recorded_by',
      'inventory_scope',
    ];

    const auditRows = logs.map((log) => [
      log.warehouse_inventory_id || null,
      log.location_inventory_id || null,
      log.inventory_action_type_id,
      log.previous_quantity,
      log.quantity_change,
      log.new_quantity,
      log.status_id,
      log.status_effective_at,
      log.performed_by,
      log.comments || null,
      log.checksum,
      JSON.stringify(log.metadata || {}),
      log.recorded_by || log.performed_by,
      log.inventory_scope ?? 'warehouse',
    ]);

    for (const log of logs) {
      if (
        (log.warehouse_inventory_id && log.location_inventory_id) ||
        (!log.warehouse_inventory_id && !log.location_inventory_id)
      ) {
        throw AppError.validationError(
          'Each log must have exactly one of warehouse_inventory_id or location_inventory_id'
        );
      }
    }

    const warehouseAuditRows = auditRows.filter((r) => r[0] !== null);
    const locationAuditRows = auditRows.filter((r) => r[1] !== null);

    // Insert warehouse-scope logs
    if (warehouseAuditRows.length) {
      await bulkInsert(
        'inventory_activity_audit_log',
        auditColumns,
        warehouseAuditRows,
        ['warehouse_inventory_id', 'inventory_action_type_id', 'recorded_at'],
        {},
        client,
        meta,
        '' // no RETURNING
      );
    }

    // Insert location-scope logs
    if (locationAuditRows.length) {
      await bulkInsert(
        'inventory_activity_audit_log',
        auditColumns,
        locationAuditRows,
        ['location_inventory_id', 'inventory_action_type_id', 'recorded_at'],
        {},
        client,
        meta,
        ''
      );
    }
  } catch (error) {
    logSystemException(error, 'Failed to insert inventory activity logs', {
      context: 'inventory-log-repository/insertInventoryActivityLogs',
    });
    throw AppError.databaseError(
      'Failed to insert inventory activity logs. See logs for details.'
    );
  }
};

module.exports = {
  insertInventoryActivityLogs,
};
