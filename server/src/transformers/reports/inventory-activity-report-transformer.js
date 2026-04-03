/**
 * @file inventory-activity-report-transformer.js
 * @description Row-level transformers for inventory activity report records.
 *
 * Exports:
 *   - transformInventoryActivityLogs      – transforms a paginated activity log result set
 *   - transformFlatInventoryActivityLogs  – transforms a flat array of activity log rows
 *
 * Internal helpers (not exported):
 *   - transformInventoryActivityLogRow – per-row transformer dispatching on batch_type
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getProductDisplayName } = require('../../utils/display-name-utils');
const { transformPageResult }   = require('../../utils/transformer-utils');
const { cleanObject }           = require('../../utils/object-utils');

/**
 * Transforms a single inventory activity log DB row into the UI-facing shape.
 *
 * Dispatches `productInfo` or `packagingMaterialInfo` based on `batch_type`.
 * Both fields are null when the batch type is unrecognised.
 *
 * @param {InventoryActivityLogRow} row
 * @returns {InventoryActivityLogRecord}
 */
const transformInventoryActivityLogRow = (row) =>
  cleanObject({
    id:             row.id,
    actionTimestamp: row.action_timestamp,
    actionType:     row.action_type,
    adjustmentType: row.adjustment_type,
    status:         row.status_name,
    performedBy:    row.performed_by,
    
    order: {
      number: row.order_number,
      type:   row.order_type,
      status: row.order_status,
    },
    
    source: {
      type:  row.source_type,
      refId: row.source_ref_id,
    },
    
    quantity: {
      previous: row.previous_quantity,
      change:   row.quantity_change,
      new:      row.new_quantity,
    },
    
    comments: row.comments,
    metadata: row.metadata,
    batchType: row.batch_type,
    
    warehouseName: row.warehouse_name ?? null,
    locationName:  row.location_name  ?? null,
    
    // Product batch fields — populated when batch_type = 'product'.
    productInfo: row.batch_type === 'product'
      ? {
        sku:         row.sku_code,
        productName: getProductDisplayName(row),
        lotNumber:   row.product_lot_number,
        expiryDate:  row.product_expiry_date,
      }
      : null,
    
    // Packaging material batch fields — populated when batch_type = 'packaging_material'.
    packagingMaterialInfo: row.batch_type === 'packaging_material'
      ? {
        lotNumber:    row.material_lot_number,
        expiryDate:   row.material_expiry_date,
        snapshotName: row.material_snapshot_name,
        code:         row.material_code,
      }
      : null,
  });

/**
 * Transforms a paginated inventory activity log result set into the UI-facing shape.
 *
 * @param {Object}                        result
 * @param {InventoryActivityLogRow[]}     result.data
 * @param {Object}                        result.pagination
 * @returns {Promise<PaginatedResult<InventoryActivityLogRow>>}
 */
const transformInventoryActivityLogs = (result) =>
  /** @type {Promise<PaginatedResult<InventoryActivityLogRow>>} */
  (transformPageResult(result, transformInventoryActivityLogRow));

/**
 * Transforms a flat array of inventory activity log rows into a simple data wrapper.
 *
 * Used for base-access queries that do not return full pagination metadata.
 *
 * @param {InventoryActivityLogRow[]} rows
 * @returns {{ data: InventoryActivityLogRecord[] }}
 */
const transformFlatInventoryActivityLogs = (rows) => ({
  data: rows.map(transformInventoryActivityLogRow),
});

module.exports = {
  transformFlatInventoryActivityLogs,
  transformInventoryActivityLogs,
};
