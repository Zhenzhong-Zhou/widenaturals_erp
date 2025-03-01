const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const getWarehouses = async ({ page, limit, sortBy, sortOrder }) => {
  const validSortColumns = [
    'name',   // Sort by warehouse name
    'location_name',    // Sort by location name
    'storage_capacity', // Sort by storage capacity
    'status_id',        // Sort by warehouse status
    'created_at',       // Sort by record creation time
    'updated_at',       // Sort by record last updated time
  ];
  
  // Default sorting (by name & creation time if invalid sortBy is provided)
  const defaultSortBy = 'w.name, w.created_at';
  sortBy = validSortColumns.includes(sortBy) ? `w.${sortBy}` : defaultSortBy;
  
  const tableName = 'warehouses w';
  
  const joins = [
    'LEFT JOIN locations l ON w.location_id = l.id',
    'LEFT JOIN status s ON w.status_id = s.id',
    'LEFT JOIN users u1 ON w.created_by = u1.id',
    'LEFT JOIN users u2 ON w.updated_by = u2.id',
  ];
  
  const whereClause = '1=1'; // No filters by default
  
  const baseQuery = `
    SELECT
        w.id,
        w.name AS warehouse_name,
        l.name AS location_name,
        w.storage_capacity,
        s.name AS status_name,
        w.created_at,
        w.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [],
        page,
        limit,
        sortBy,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching warehouses:', error);
    throw new AppError('Failed to fetch warehouses.');
  }
};

const getWarehouseInventorySummary = async ({ page, limit, statusFilter }) => {
  const tableName = 'warehouses w';
  
  // Joins using an array (easier to modify in the future)
  const joins = [
    'LEFT JOIN status s ON w.status_id = s.id',
  ];

  // Dynamic status filtering
  let whereClause = '';
  const params = [];
  
  if (statusFilter && statusFilter !== 'all') {
    whereClause = `s.name = $1`;
    params.push(statusFilter);
  }
  
  // Base Query
  const baseQuery = `
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      COALESCE(s.name, 'unknown') AS status_name,
      COUNT(DISTINCT wi.product_id) AS total_products,
      COALESCE(SUM(wi.reserved_quantity), 0) AS total_reserved_stock,
      COALESCE(SUM(CASE WHEN wil.quantity > 0 THEN wil.quantity ELSE 0 END), 0) AS total_available_stock,
      COALESCE(SUM(wi.warehouse_fee), 0) AS total_warehouse_fees,
      MAX(wi.last_update) AS last_inventory_update,
      COUNT(DISTINCT wil.lot_number) AS total_lots,
      MIN(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS earliest_expiry,
      MAX(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS latest_expiry,
      COUNT(DISTINCT CASE WHEN wil.quantity = 0 THEN wil.lot_number END) AS total_zero_stock_lots
    FROM ${tableName}
    LEFT JOIN warehouse_inventory wi ON w.id = wi.warehouse_id
    LEFT JOIN warehouse_inventory_lots wil ON w.id = wil.warehouse_id AND wi.product_id = wil.product_id
    LEFT JOIN products p ON wi.product_id = p.id
    LEFT JOIN status s ON w.status_id = s.id
    WHERE ${whereClause}
    GROUP BY w.id, w.name, s.name
  `;
  
  try {
    // Use pagination if required
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params,
        page,
        limit,
        sortBy: 'w.name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(`Error fetching warehouse inventory overview (page: ${page}, limit: ${limit}, status: ${statusFilter}):`, error);
    throw new AppError('Failed to fetch warehouse inventory overview.');
  }
};

module.exports = {
  getWarehouses,
  getWarehouseInventorySummary,
};
