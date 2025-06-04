/**
 * @fileoverview
 * Utility for dynamically building SQL WHERE clause and parameter bindings
 * for `batch_registry`–related queries.
 *
 * Features:
 * - Dynamically filters by batch type (e.g., 'product', 'packaging_material')
 * - Optionally excludes batches already present in warehouse or location inventory
 * - Uses safe positional SQL bindings (e.g., $1, $2)
 * - Designed for reuse across dropdowns, insert checks, and batch selection UIs
 *
 * Extendable to support additional filters like:
 * - Expiry date ranges
 * - Lot number (partial or exact)
 * - Manufacturer or SKU
 */

/**
 * Builds an SQL WHERE clause and parameter list for querying `batch_registry` records.
 *
 * Supports:
 * - Filtering by batch type (e.g., 'product' or 'packaging_material')
 * - Excluding already-used batches based on their presence in:
 *   - Any warehouse (`warehouse_inventory`)
 *   - Any location (`location_inventory`)
 *   - Both (combined check)
 * - Optional scoping of exclusions to a specific warehouse or location.
 *
 * @param {Object} filters - Filtering options.
 * @param {'product'|'packaging_material'=} [filters.batchType] - Optional batch type to include in the result.
 * @param {'warehouse_only'|'location_only'|'any_inventory'=} [filters.excludeFrom] - Optional exclusion rule based on inventory presence.
 * @param {string=} [filters.warehouseId] - Optional warehouse ID to scope the exclusion for `warehouse_only`.
 * @param {string=} [filters.locationId] - Optional location ID to scope the exclusion for `location_only`.
 *
 * @returns {{ whereClause: string, params: any[] }} - An object containing the SQL WHERE clause string and the parameter bindings array.
 */
const buildBatchRegistryWhereClause = (filters = {}) => {
  const whereClauses = ['1=1'];
  const params = [];

  if (filters.batchType) {
    params.push(filters.batchType);
    whereClauses.push(`br.batch_type = $${params.length}`);
  }

  if (filters.warehouseId) {
    whereClauses.push(`
      NOT EXISTS (
        SELECT 1 FROM warehouse_inventory wi
        WHERE wi.batch_id = br.id AND wi.warehouse_id = $${params.length + 1}
      )
    `);
    params.push(filters.warehouseId);
  }

  if (filters.locationId) {
    whereClauses.push(`
      NOT EXISTS (
        SELECT 1 FROM location_inventory li
        WHERE li.batch_id = br.id AND li.location_id = $${params.length + 1}
      )
    `);
    params.push(filters.locationId);
  }

  return {
    whereClause: whereClauses.join(' AND '),
    params,
  };
};

module.exports = {
  buildBatchRegistryWhereClause,
};
