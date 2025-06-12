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
      brand: row.product_brand,
      category: row.product_category,
    };
  }
  
  if (row.batch_type === 'packaging_material') {
    base.packagingMaterialInfo = {
      lotNumber: row.material_lot_number,
      snapshotName: row.material_snapshot_name,
      receivedLabelName: row.received_label_name,
      quantity: row.material_quantity,
      unit: row.material_unit,
    };
  }
  
  return cleanObject(base);
};

/**
 * Groups and merges inventory activity log rows that represent the same action.
 * Groups by composite key:
 * - action_timestamp
 * - source_type
 * - source_ref_id
 * - batch_type
 *
 * Deduplicates repeated warehouse/location metadata and merges associated
 * product or packaging information into the grouped result.
 *
 * @param {Array<Object>} rows - Array of raw log rows from database
 * @returns {Array<Object>} Cleaned and grouped log entries
 */
const mergeDuplicateInventoryActivityLogs = (rows = []) => {
  const mergedMap = new Map();
  
  for (const row of rows) {
    const key = `${row.action_timestamp}::${row.source_type}::${row.source_ref_id}::${row.batch_type}`;
    
    if (!mergedMap.has(key)) {
      mergedMap.set(key, buildBaseInventoryActivityLogEntry(row));
    }
    
    const record = mergedMap.get(key);
    
    if (!record.productInfo && row.batch_type === 'product') {
      record.productInfo = {
        sku: row.sku_code,
        productName: getProductDisplayName(row),
        brand: row.product_brand,
        category: row.product_category,
      };
    }
    
    if (!record.packagingMaterialInfo && row.batch_type === 'packaging_material') {
      record.packagingMaterialInfo = {
        lotNumber: row.material_lot_number,
        snapshotName: row.material_snapshot_name,
        receivedLabelName: row.received_label_name,
        quantity: row.material_quantity,
        unit: row.material_unit,
      };
    }
  }
  
  return Array.from(mergedMap.values()).map(cleanObject);
};

/**
 * Transforms a paginated inventory activity log result into frontend format.
 *
 * Options:
 * - `merge: true`: applies grouping logic for logical actions (e.g., transfers)
 * - `includeLoadMore: true`: returns { items, offset, limit, hasMore } instead of traditional pagination
 *
 * @param {Object} result - Raw-paginated query result: { data: Array, pagination: Object }
 * @param {Object} [options={}] - Transformation options
 * @param {boolean} [options.merge=false] - Whether to group duplicate logs
 * @param {boolean} [options.includeLoadMore=false] - Use load-more pagination style
 * @returns {Object} Transformed result with formatted `data` or `items`, plus pagination metadata
 */
const transformInventoryActivityLogs = (result, options = {}) => {
  const { merge = false, includeLoadMore = false } = options;
  
  if (merge) {
    const { pagination = {}, data = [] } = result;
    const mergedData = mergeDuplicateInventoryActivityLogs(data);
    
    return {
      data: mergedData,
      pagination: {
        ...pagination,
        totalRecords: mergedData.length,
        totalPages: Math.ceil(mergedData.length / (pagination.limit || 10)),
      },
    };
  }
  
  // Default: flat transformation with pagination
  return transformPaginatedResult(result, transformInventoryActivityLogRow, {
    includeLoadMore,
  });
};

module.exports = {
  transformInventoryActivityLogRow,
  mergeDuplicateInventoryActivityLogs,
  transformInventoryActivityLogs,
};
