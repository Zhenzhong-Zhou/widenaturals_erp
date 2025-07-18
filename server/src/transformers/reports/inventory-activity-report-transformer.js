const { getProductDisplayName } = require('../../utils/display-name-utils');
const { transformPaginatedResult } = require('../../utils/transformer-utils');
const { cleanObject } = require('../../utils/object-utils');

/**
 * Builds a base inventory activity log object from a raw database row.
 * Used as a shared utility for both flat and grouped transformations.
 *
 * Includes common fields like timestamp, quantity, source, and related order.
 *
 * @param {Object} row - Raw database row from inventory activity log query
 * @returns {Object} Structured base log object with null-filled product/packaging fields
 */
const buildBaseInventoryActivityLogEntry = (row) => ({
  id: row.id,
  actionTimestamp: row.action_timestamp,
  actionType: row.action_type,
  adjustmentType: row.adjustment_type,
  status: row.status_name,
  performedBy: row.performed_by,
  order: {
    number: row.order_number,
    type: row.order_type,
    status: row.order_status,
  },
  source: {
    type: row.source_type,
    refId: row.source_ref_id,
  },
  quantity: {
    previous: row.previous_quantity,
    change: row.quantity_change,
    new: row.new_quantity,
  },
  comments: row.comments,
  metadata: row.metadata,
  batchType: row.batch_type,
  warehouseName: row.warehouse_name ?? null,
  locationName: row.location_name ?? null,
  productInfo: null,
  packagingMaterialInfo: null,
});

/**
 * Transforms a single inventory activity log row into a clean, flat structure.
 * Appends relevant product or packaging material metadata based on a batch type.
 * Does not perform any grouping or deduplication.
 *
 * Suitable for paginated tables, flat exports, or history views.
 *
 * @param {Object} row - A single raw inventory activity log row
 * @returns {Object} Transformed and cleaned a row object
 */
const transformInventoryActivityLogRow = (row) => {
  const base = buildBaseInventoryActivityLogEntry(row);

  if (row.batch_type === 'product') {
    base.productInfo = {
      sku: row.sku_code,
      productName: getProductDisplayName(row),
      lotNumber: row.product_lot_number,
      expiryDate: row.product_expiry_date,
    };
  }

  if (row.batch_type === 'packaging_material') {
    base.packagingMaterialInfo = {
      lotNumber: row.material_lot_number,
      expiryDate: row.material_expiry_date,
      snapshotName: row.material_snapshot_name,
      code: row.material_code,
    };
  }

  return cleanObject(base);
};

/**
 * Transforms a flat array of inventory activity logs using row transformer.
 *
 * For base-permission-limited responses without pagination metadata.
 *
 * @param {Array} rows - Raw inventory activity log rows
 * @returns {{ data: Array }} Transformed result
 */
const transformFlatInventoryActivityLogs = (rows) => {
  return {
    data: rows.map(transformInventoryActivityLogRow),
  };
};

/**
 * Transforms a paginated inventory activity log result into a flat frontend-friendly format.
 *
 * Applies a flat transformation to each row using `transformInventoryActivityLogRow`.
 * Designed for use with standard page-based pagination (page/limit).
 *
 * @param {Object} result - Raw-paginated query result: { data: Array, pagination: Object }
 * @returns {Object} Transformed result with `data` and pagination metadata
 */
const transformInventoryActivityLogs = (result) => {
  return transformPaginatedResult(result, transformInventoryActivityLogRow);
};

module.exports = {
  transformFlatInventoryActivityLogs,
  transformInventoryActivityLogs,
};
