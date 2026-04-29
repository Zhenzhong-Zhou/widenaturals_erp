/**
 * @file inventory-activity-log-transformer.js
 * @description Pure transformer functions for the inventory activity log domain.
 * Converts raw DB rows into UI-facing records and wraps paginated result sets.
 */

'use strict';

const { getFullName } = require('../utils/person-utils');
const { makeStatus } = require('../utils/status-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * Transforms a single raw DB row into a UI-facing inventory activity log record.
 *
 * @param {InventoryActivityLogRow} row
 * @returns {InventoryActivityLogRecord}
 */
const transformInventoryActivityLogRecord = (row) => ({
  id: row.id,
  warehouseInventoryId: row.warehouse_inventory_id,
  batchType: row.batch_type,
  previousQuantity: row.previous_quantity,
  quantityChange: row.quantity_change,
  newQuantity: row.new_quantity,
  actionTypeName: row.action_type_name,
  actionTypeCategory: row.action_type_category,
  adjustmentTypeName: row.adjustment_type_name,
  status: makeStatus({
    status_id: row.status_id,
    status_name: row.status_name,
    status_date: row.status_effective_at,
  }),
  referenceType: row.reference_type,
  referenceId: row.reference_id,
  comments: row.comments,
  metadata: row.metadata,
  performedAt: row.performed_at,
  performedByName: getFullName(
    row.performed_by_firstname,
    row.performed_by_lastname
  ),

  // Batch context — one side will be null depending on batch_type
  productLotNumber: row.product_lot_number,
  productName: row.product_name,
  sku: row.sku,
  packagingLotNumber: row.packaging_lot_number,
  packagingDisplayName: row.packaging_display_name,
  packagingMaterialCode: row.packaging_material_code,
});

/**
 * Transforms a paginated result set of raw inventory activity log rows.
 *
 * @param {PaginatedResult<InventoryActivityLogRow>} paginatedResult
 * @returns {Promise<PaginatedResult<InventoryActivityLogRow>>}
 */
const transformPaginatedInventoryActivityLog = (paginatedResult) =>
  transformPageResult(paginatedResult, transformInventoryActivityLogRecord);

module.exports = {
  transformInventoryActivityLogRecord,
  transformPaginatedInventoryActivityLog,
};
