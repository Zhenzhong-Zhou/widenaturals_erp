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
 * Supports filtering by batch type and excluding already-used batches based on their presence
 * in `warehouse_inventory`, `location_inventory`, or both.
 *
 * @param {Object} filters - Filtering options.
 * @param {('product'|'packaging_material')=} filters.batchType - Optional batch type to include in the result.
 * @param {'warehouse_only'|'location_only'|'any_inventory'=} filters.excludeFrom - Optional exclusion rule based on inventory presence.
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL WHERE clause string and parameter bindings array.
 */
const buildBatchRegistryWhereClause = (filters = {}) => {
  const whereClauses = ['1=1'];
  const params = [];
  
  if (filters.batchType) {
    params.push(filters.batchType);
    whereClauses.push(`br.batch_type = $${params.length}`);
  }
  
  switch (filters.excludeFrom) {
    case 'warehouse_only':
      whereClauses.push(`NOT EXISTS (SELECT 1 FROM warehouse_inventory wi WHERE wi.batch_id = br.id)`);
      break;
    case 'location_only':
      whereClauses.push(`NOT EXISTS (SELECT 1 FROM location_inventory li WHERE li.batch_id = br.id)`);
      break;
    case 'any_inventory':
      whereClauses.push(`
      NOT EXISTS (
        SELECT 1 FROM warehouse_inventory wi WHERE wi.batch_id = br.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM location_inventory li WHERE li.batch_id = br.id
      )
    `);
      break;
  }
  
  return {
    whereClause: whereClauses.join(' AND '),
    params,
  };
};

module.exports = {
  buildBatchRegistryWhereClause,
};
