const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const getWarehouseInventories = async ({ page, limit, sortBy, sortOrder = 'ASC' }) => {
  const validSortColumns = {
    warehouse_name: 'w.name',
    location_name: 'l.name',
    storage_capacity: 'w.storage_capacity',
    status_id: 'w.status_id',
    created_at: 'w.created_at',
    updated_at: 'w.updated_at'
  };

  // Default sorting (by warehouse name & creation time)
  const defaultSortBy = 'w.name, w.created_at';
  sortBy = validSortColumns[sortBy] || defaultSortBy;

  // Validate sortOrder, default to 'ASC'
  sortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
  
  const tableName = 'warehouse_inventory wi';
  
  const joins = [
    'LEFT JOIN warehouses w ON wi.warehouse_id = w.id',
    'LEFT JOIN products p ON wi.product_id = p.id',
    'LEFT JOIN locations l ON w.location_id = l.id',
    'LEFT JOIN status s ON w.status_id = s.id',
    'LEFT JOIN users u1 ON wi.created_by = u1.id',
    'LEFT JOIN users u2 ON wi.updated_by = u2.id'
  ];
  
  const whereClause = '1=1'; // No filters by default
  
  const baseQuery = `
    SELECT
      wi.id AS warehouse_inventory_id,
      wi.warehouse_id,
      w.name AS warehouse_name,
      w.storage_capacity,
      l.name AS location_name,
      wi.product_id,
      p.product_name,
      wi.reserved_quantity,
      wi.warehouse_fee,
      wi.last_update,
      wi.status_id,
      s.name AS status_name,
      wi.status_date,
      wi.created_at,
      wi.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        queryText: baseQuery,
        tableName,
        joins,
        whereClause,
        params: [],
        page,
        limit,
        sortBy,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching all warehouse inventories:', error);
    throw new AppError('Failed to fetch all warehouse inventories.');
  }
};

const getWarehouseProductSummary = async (warehouse_id) => {
const baseQuery = `
SELECT
    p.id AS product_id,
    p.product_name,
    SUM(wil.quantity) AS total_available_stock,
    SUM(wi.reserved_quantity) AS total_reserved_stock
FROM warehouse_inventory wi
JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND wi.product_id = wil.product_id
JOIN products p ON wi.product_id = p.id
WHERE wi.warehouse_id = $1
GROUP BY p.id, p.product_name
ORDER BY p.product_name
LIMIT 10 OFFSET 0; -- Pagination applied
`;
};

module.exports = {
  getWarehouseInventories,
  getWarehouseProductSummary,
};
