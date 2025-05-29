/**
 * @fileoverview
 * Utility for dynamically building SQL WHERE clause and parameter bindings
 * for any warehouse inventory–related queries.
 *
 * This utility ensures:
 * - Centralized filtering logic across all warehouse inventory views
 * - Support for both product-based and packaging material–based batches
 * - Parameter-safe query generation
 * - Clean separation of system filters (e.g. non-zero quantity) and user-applied filters
 *
 * Supported filters include:
 * - Text filters: SKU, product name, material name, lot number (ILIKE)
 * - Date filters: expiryDate, createdAt
 * - Foreign keys: warehouseId, status
 */

const { buildInventoryFilterConditions } = require('./build-inventory-filter-conditions');

/**
 * Builds the SQL WHERE clause and parameter bindings for querying `warehouse_inventory`
 * with support for both product and packaging material batch types.
 *
 * Includes:
 * - Optional filter for excluding zero-quantity rows
 * - Shared dynamic filters via `buildInventoryFilterConditions`
 *
 * @param {Object} filters - Optional filter object
 * @param {string} [filters.warehouseName] - Partial warehouse name (ILIKE)
 * @param {string} [filters.batchType] - 'product' or 'packaging_material'
 * @param {string} [filters.sku] - Partial SKU (ILIKE)
 * @param {string} [filters.productName] - Partial product name (ILIKE)
 * @param {string} [filters.materialName] - Partial material name (ILIKE)
 * @param {string} [filters.materialCode] - Partial material code (ILIKE)
 * @param {string} [filters.partCode] - Partial part code (ILIKE)
 * @param {string} [filters.partName] - Partial part name (ILIKE)
 * @param {string} [filters.partType] - Partial part type (ILIKE)
 * @param {string} [filters.lotNumber] - Partial lot number (applies to both product and material)
 * @param {string} [filters.expiryDate] - Exact expiry date (YYYY-MM-DD)
 * @param {string} [filters.createdAt] - Exact creation date (YYYY-MM-DD)
 * @param {string} [filters.status] - Inventory status name
 * @param {boolean} [filters.excludeZeroQuantity] - Whether to exclude records with 0 quantity (default: false)
 *
 * @returns {{ whereClause: string, params: any[] }} SQL WHERE clause and parameter list
 */
const buildWarehouseInventoryWhereClause = (filters = {}) => {
  const whereClauses = [
    `(
      (br.batch_type = 'product' AND p.status_id IS NOT NULL AND s.status_id IS NOT NULL AND pb.status_id IS NOT NULL)
      OR
      (br.batch_type = 'packaging_material' AND pmb.id IS NOT NULL)
    )`,
  ];
  
  if (filters.excludeZeroQuantity) {
    whereClauses.push(`(wi.total_quantity > 0 OR wi.reserved_quantity > 0)`);
  }
  
  const { conditions, params } = buildInventoryFilterConditions(filters, {
    prefix: 'wi',
    warehouseName: 'wh.name',
    createdAt: 'created_at',
  });
  
  return {
    whereClause: [...whereClauses, ...conditions].join(' AND '),
    params,
  };
};

module.exports = {
  buildWarehouseInventoryWhereClause,
};
