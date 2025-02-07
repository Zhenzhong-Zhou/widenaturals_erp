const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetch all inventory items with pagination & sorting.
 * @param {Object} options - Query parameters
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Number of results per page
 * @param {string} [options.sortBy='name'] - Column to sort by
 * @param {string} [options.sortOrder='ASC'] - Sorting order (ASC/DESC)
 * @returns {Promise<{ data: Array, pagination: Object }>} Inventory data with pagination info
 */
const getInventories = async ({ page = 1, limit = 10, sortBy, sortOrder } = {}) => {
  const validSortColumns = [
    'product_name',    // Sort by product name
    'location_name',   // Sort by location name
    'item_type',       // Sort by item type
    'lot_number',      // Sort by lot number (useful for batch tracking)
    'quantity',        // Sort by available quantity
    'warehouse_fee',   // Sort by storage fee
    'status_id',       // Sort by inventory status (instead of status_name)
    'status_date',     // Sort by the last status update
    'inbound_date',    // Sort by when the item was received
    'outbound_date',   // Sort by when the item was shipped out
    'last_update',     // Sort by the last modified date
    'created_at',      // Sort by record creation time
    'updated_at',      // Sort by record last updated time
  ];
  
  // Ensure sorting defaults to location_id then created_at if invalid
  let defaultSortBy = 'location_id, created_at';
  
  // Prevent SQL injection by ensuring sort column is valid
  if (!validSortColumns.includes(sortBy)) {
    sortBy = defaultSortBy;
  }
  
  const tableName = 'inventory i';
  
  const joins = [
    'LEFT JOIN products p ON i.product_id = p.id',
    'LEFT JOIN locations l ON i.location_id = l.id',
    'LEFT JOIN status s ON i.status_id = s.id',
    'LEFT JOIN users u1 ON i.created_by = u1.id',
    'LEFT JOIN users u2 ON i.updated_by = u2.id',
    'LEFT JOIN warehouse_inventory wi ON i.product_id = wi.product_id',
    'LEFT JOIN warehouses w ON wi.warehouse_id = w.id',
    'LEFT JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND i.product_id = wil.product_id',
  ];
  
  const whereClause = '1=1';
  
  const text = `
    SELECT
      i.id AS inventory_id,
      i.product_id,
      p.product_name AS product_name,
      i.location_id,
      l.name AS location_name,
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      i.item_type,
      i.identifier,
      i.quantity,
      i.inbound_date,
      i.outbound_date,
      i.last_update,
      i.status_id,
      s.name AS status_name,
      i.status_date,
      i.created_at,
      i.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
      wi.warehouse_fee,
      COUNT(wil.id) AS total_lots,
      SUM(wil.quantity) AS total_lot_quantity,
      MIN(wil.manufacture_date) AS earliest_manufacture_date,
      MIN(wil.expiry_date) AS nearest_expiry_date
    FROM ${tableName}
    ${joins.join(' ')}
    GROUP BY
      i.id, p.product_name, l.name, s.name,
      u1.firstname, u1.lastname, u2.firstname, u2.lastname,
      wi.warehouse_fee, w.id, w.name
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: text,
        params: [],
        page,
        limit,
        sortBy: `i.${sortBy}`,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching inventories:', error);
    throw new AppError('Failed to fetch inventories');
  }
};

module.exports = {
  getInventories,
};
