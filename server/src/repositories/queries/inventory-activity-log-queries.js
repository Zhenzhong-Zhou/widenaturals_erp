/**
 * @file inventory-activity-log-queries.js
 * @description SQL column configuration for inventory-activity-log-repository.js.
 *
 * Exports:
 *  - INVENTORY_ACTIVITY_LOG_COLUMNS        — ordered column list for activity log insert
 *  - INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS  — ordered column list for audit log insert
 *  - INVENTORY_ACTIVITY_LOG_CONFLICT_COLUMNS      — empty — append-only
 *  - INVENTORY_ACTIVITY_AUDIT_WAREHOUSE_CONFLICT_COLUMNS — conflict target for warehouse-scope audit
 *  - INVENTORY_ACTIVITY_AUDIT_LOCATION_CONFLICT_COLUMNS  — conflict target for location-scope audit
 */

'use strict';

// Order must match the values array in insertInventoryActivityLogs activity row map.
const INVENTORY_ACTIVITY_LOG_COLUMNS = [
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

// Order must match the values array in insertInventoryActivityLogs audit row map.
const INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS = [
  'warehouse_inventory_id',
  'location_inventory_id',
  'inventory_action_type_id',
  'previous_quantity',
  'quantity_change',
  'new_quantity',
  'status_id',
  'action_by',
  'comments',
  'checksum',
  'metadata',
  'recorded_by',
  'inventory_scope',
];

// Activity log is append-only — no conflict resolution.
const INVENTORY_ACTIVITY_LOG_CONFLICT_COLUMNS = [];

// Audit log conflict targets are separated by scope — each has its own unique constraint.
const INVENTORY_ACTIVITY_AUDIT_WAREHOUSE_CONFLICT_COLUMNS = [
  'warehouse_inventory_id',
  'inventory_action_type_id',
  'recorded_at',
];

const INVENTORY_ACTIVITY_AUDIT_LOCATION_CONFLICT_COLUMNS = [
  'location_inventory_id',
  'inventory_action_type_id',
  'recorded_at',
];

module.exports = {
  INVENTORY_ACTIVITY_LOG_COLUMNS,
  INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS,
  INVENTORY_ACTIVITY_LOG_CONFLICT_COLUMNS,
  INVENTORY_ACTIVITY_AUDIT_WAREHOUSE_CONFLICT_COLUMNS,
  INVENTORY_ACTIVITY_AUDIT_LOCATION_CONFLICT_COLUMNS,
};
