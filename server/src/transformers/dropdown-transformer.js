const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms an array of raw batch registry rows into dropdown-friendly shapes.
 *
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Array of transformed dropdown objects.
 */
const transformBatchRegistryDropdownItem = (row) => {
  return cleanObject({
    id: row.batch_registry_id,
    type: row.batch_type,
    product: row.product_batch_id
      ? {
        id: row.product_batch_id,
        name: getProductDisplayName(row),
        lotNumber: row.product_lot_number,
        expiryDate: row.product_expiry_date,
      }
      : null,
    packagingMaterial: row.packaging_material_batch_id
      ? {
        id: row.packaging_material_batch_id,
        lotNumber: row.material_lot_number,
        expiryDate: row.material_expiry_date,
        snapshotName: row.material_snapshot_name,
        receivedLabel: row.received_label_name,
      }
      : null,
  });
};

/**
 * Transforms a paginated result of batch registry records for dropdown usage,
 * applying a row-level transformer and formatting the response for load-more support.
 *
 * @param {Object} paginatedResult - The raw paginated query result.
 * @returns {Object} Transformed response including items, limit, offset, and hasMore flag.
 */
const transformPaginatedDropdownResultList = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformBatchRegistryDropdownItem, { includeLoadMore: true });

/**
 * Transforms raw warehouse dropdown rows into dropdown-compatible format.
 *
 * @param {Array<Object>} rows - Raw rows from the warehouse dropdown query
 * @returns {Array<Object>} Transformed dropdown items
 */
const transformWarehouseDropdownRows = (rows) => {
  if (!Array.isArray(rows)) return [];
  
  return rows.map((row) => ({
    value: row.warehouse_id,
    label: `${row.warehouse_name} (${row.location_name})`,
    metadata: {
      locationId: row.location_id,
      locationName: row.location_name,
      locationTypeId: row.location_type_id,
      warehouseTypeName: row.warehouse_type_name ?? null,
      statusId: row.status_id,
    },
  }));
};

module.exports = {
  transformPaginatedDropdownResultList,
  transformWarehouseDropdownRows,
};
