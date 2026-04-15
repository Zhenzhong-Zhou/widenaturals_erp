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

const IAL_INSERT_COLUMNS = [
  'warehouse_inventory_id',
  'inventory_action_type_id',
  'adjustment_type_id',
  'previous_quantity',
  'quantity_change',
  'new_quantity',
  'status_id',
  'status_effective_at',
  'reference_type',
  'reference_id',
  'performed_by',
  'comments',
  'checksum',
  'metadata',
  'created_by',
];

module.exports = {
  IAL_INSERT_COLUMNS,
};
