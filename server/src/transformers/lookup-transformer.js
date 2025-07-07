const { getProductDisplayName } = require('../utils/display-name-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { getFullName } = require('../utils/name-utils');

/**
 * Transforms an array of raw batch registry rows into lookup-friendly shapes.
 *
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Array of transformed lookup objects.
 */
const transformBatchRegistryLookupItem = (row) => {
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
 * Transforms a paginated result of batch registry records for lookup usage,
 * applying a row-level transformer and formatting the response for load-more support.
 *
 * @param {Object} paginatedResult - The raw paginated query result.
 * @returns {Object} Transformed response including items, limit, offset, and hasMore flag.
 */
const transformBatchRegistryPaginatedLookupResult = (paginatedResult) =>
  transformPaginatedResult(
    paginatedResult,
    transformBatchRegistryLookupItem,
    { includeLoadMore: true }
  );

/**
 * Transforms raw warehouse lookup rows into lookup-compatible format.
 *
 * @param {Array<Object>} rows - Raw rows from the warehouse lookup query
 * @returns {Array<Object>} Transformed lookup items
 */
const transformWarehouseLookupRows = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    value: row.warehouse_id,
    label: `${row.warehouse_name} (${row.location_name}${row.warehouse_type_name ? ' - ' + row.warehouse_type_name : ''})`,
    metadata: {
      locationId: row.location_id,
      locationTypeId: row.location_type_id,
    },
  }));
};

/**
 * Transforms a result set of lot adjustment type records into lookup-friendly options,
 * applying formatting for value, label, and associated action type.
 *
 * @param {Array<Object>} rows - Raw query result rows from lot_adjustment_types join.
 * @returns {Array<{ value: string, label: string, actionTypeId: string }>}
 * Transformed options for use in dropdowns or autocomplete components.
 *
 * @example
 * const transformed = transformLotAdjustmentLookupOptions(rows);
 * // [
 * // { value: '581f...', label: 'Adjustment Type A', actionTypeId: 'a7c1...' },
 * // { value: '1234...', label: 'Adjustment Type B', actionTypeId: 'b2d4...' }
 * // ]
 */
const transformLotAdjustmentLookupOptions = (rows) => {
  if (!Array.isArray(rows)) return [];
  
  return rows.map((row) => ({
    value: row.lot_adjustment_type_id,
    label: row.name,
    actionTypeId: row.inventory_action_type_id,
  }));
};

/**
 * Transforms a single raw customer record into a lookup-friendly format.
 *
 * @param {{ id: string, firstname: string, lastname: string, email: string }} row
 *   The raw customer record.
 * @returns {{ id: string, label: string }}
 *   The transformed lookup item with id and label.
 *
 * @example
 * const result = transformCustomerLookup({
 *   id: 'abc123',
 *   firstname: 'John',
 *   lastname: 'Doe',
 *   email: 'john@example.com'
 * });
 * // result: { id: 'abc123', label: 'John Doe (john@example.com)' }
 */
const transformCustomerLookup = (row) => ({
  id: row.id,
  label: `${getFullName(row.firstname, row.lastname)} (${row.email || 'no-email'})`,
});

/**
 * Transforms a paginated result of customer records for lookup usage,
 * applying a row-level transformer and formatting the response for load-more support.
 *
 * @param {Object} paginatedResult - The raw paginated query result.
 * @returns {Object} Transformed response including items, limit, offset, and hasMore flag.
 */
const transformCustomerPaginatedLookupResult = (paginatedResult) =>
  transformPaginatedResult(
    paginatedResult,
    transformCustomerLookup,
    { includeLoadMore: true }
  );

module.exports = {
  transformBatchRegistryPaginatedLookupResult,
  transformWarehouseLookupRows,
  transformLotAdjustmentLookupOptions,
  transformCustomerPaginatedLookupResult,
};
