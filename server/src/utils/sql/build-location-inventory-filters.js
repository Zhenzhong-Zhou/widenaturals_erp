/**
 * @fileoverview
 * Utility for dynamically building SQL WHERE clause and parameter bindings
 * for any location inventory–related queries, not just summary views.
 *
 * This utility ensures:
 * - Reusable, centralized filter logic for all queries tied to the `location_inventory` domain
 * - Consistent support for both product-based and packaging material–based inventory rows
 * - Safe SQL parameter binding (to prevent injection)
 * - Clean separation between system-defined filters (e.g. non-zero quantity)
 *   and user-applied filters (e.g. SKU, lot number, inbound date)
 *
 * Supported filters include:
 * - Text filters: SKU, product name, material name, lot number (ILIKE)
 * - Date filters: inboundDate, expiryDate, createdAt
 * - Foreign keys: locationId, statusId
 *
 * Use this utility inside repository or service-layer functions
 * that query `location_inventory`, regardless of whether it’s for
 * summary tables, detail views, export operations, or monitoring.
 */

/**
 * Builds WHERE clause and parameter list for location inventory summary filtering.
 *
 * @param {Object} filters - Filter options
 * @param {string} [filters.locationId] - Optional location ID to filter by
 * @param {string} [filters.sku] - Optional SKU keyword (ILIKE)
 * @param {string} [filters.productName] - Optional product name (ILIKE)
 * @param {string} [filters.materialName] - Optional material name (ILIKE)
 * @param {string} [filters.lotNumber] - Optional lot number (ILIKE, batch-type dependent)
 * @param {string} [filters.inboundDate] - Exact match for inbound date (yyyy-mm-dd)
 * @param {string} [filters.expiryDate] - Exact match for expiry date
 * @param {string} [filters.statusId] - Optional inventory status ID
 * @param {string} [filters.status] - Optional status fallback if statusId is missing
 * @param {string} [filters.createdAt] - Exact match for creation date
 * @returns {{ whereClause: string, params: any[] }} SQL-ready clause and parameter bindings
 */
const buildLocationInventoryWhereClause = (filters = {}) => {
  const whereClauses = [];
  const params = [];
  
  // Core conditions (always applied)
  whereClauses.push(`(li.location_quantity > 0 OR li.reserved_quantity > 0)`);
  whereClauses.push(`
    (
      (br.batch_type = 'product' AND p.status_id IS NOT NULL AND s.status_id IS NOT NULL AND pb.status_id IS NOT NULL)
      OR
      (br.batch_type = 'packaging_material' AND pmb.id IS NOT NULL)
    )
  `);
  
  // Dynamic filters
  if (filters.locationId) {
    params.push(filters.locationId);
    whereClauses.push(`li.location_id = $${params.length}`);
  }
  
  if (filters.sku) {
    params.push(`%${filters.sku}%`);
    whereClauses.push(`s.sku ILIKE $${params.length}`);
  }
  
  if (filters.productName) {
    params.push(`%${filters.productName}%`);
    whereClauses.push(`p.name ILIKE $${params.length}`);
  }
  
  if (filters.materialName) {
    params.push(`%${filters.materialName}%`);
    whereClauses.push(`pm.name ILIKE $${params.length}`);
  }
  
  if (filters.lotNumber) {
    params.push(`%${filters.lotNumber}%`);
    whereClauses.push(`
      (
        (br.batch_type = 'product' AND pb.lot_number ILIKE $${params.length})
        OR
        (br.batch_type = 'packaging_material' AND pmb.lot_number ILIKE $${params.length})
      )
    `);
  }
  
  if (filters.inboundDate) {
    params.push(filters.inboundDate);
    whereClauses.push(`li.inbound_date::date = $${params.length}`);
  }
  
  if (filters.expiryDate) {
    params.push(filters.expiryDate);
    whereClauses.push(`
      (
        (br.batch_type = 'product' AND pb.expiry_date = $${params.length})
        OR
        (br.batch_type = 'packaging_material' AND pmb.expiry_date = $${params.length})
      )
    `);
  }
  
  if (filters.statusId || filters.status) {
    const value = filters.statusId || filters.status;
    params.push(value);
    whereClauses.push(`li.status_id = $${params.length}`);
  }
  
  if (filters.createdAt) {
    params.push(filters.createdAt);
    whereClauses.push(`li.created_at::date = $${params.length}`);
  }
  
  return {
    whereClause: whereClauses.join(' AND '),
    params,
  };
}

module.exports = {
  buildLocationInventoryWhereClause,
};