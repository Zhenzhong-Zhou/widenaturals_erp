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
    'LEFT JOIN inventory i ON wi.inventory_id = i.id',
    'LEFT JOIN products p ON i.product_id = p.id',
    'LEFT JOIN locations l ON w.location_id = l.id',
    'LEFT JOIN warehouse_lot_status ws ON wi.status_id = ws.id',
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
      wi.inventory_id,
      p.product_name,
      i.item_type,
      i.identifier,
      wi.reserved_quantity,
      wi.available_quantity,
      wi.warehouse_fee,
      wi.last_update,
      wi.status_id,
      ws.name AS status_name,
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

const getWarehouseProductSummary = async ({ warehouse_id, page = 1, limit = 10 }) => {
  const tableName = 'warehouse_inventory wi';
  
  const joins = [
    'INNER JOIN warehouse_inventory_lots wil ON wi.warehouse_id = wil.warehouse_id AND wi.inventory_id = wil.inventory_id',
    'JOIN inventory i ON wi.inventory_id = i.id', // Fetch from inventory
    'JOIN products p ON i.product_id = p.id' // Referenced via inventory
  ];
  
  // Dynamic WHERE clause
  const whereClause = 'wi.warehouse_id = $1';
  const params = [warehouse_id];
  
  // Base Query
  const baseQuery = `
    SELECT
        i.id AS inventory_id,
        p.product_name,
        COUNT(DISTINCT wil.lot_number) AS total_lots,
        SUM(wi.reserved_quantity) AS total_reserved_stock,
        SUM(wi.available_quantity) AS total_available_stock,
        SUM(wil.quantity) AS total_quantity_stock,
        COUNT(DISTINCT CASE WHEN wil.quantity = 0 THEN wil.lot_number END) AS total_zero_stock_lots,
        MIN(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS earliest_expiry,
        MAX(CASE WHEN wil.quantity > 0 THEN wil.expiry_date ELSE NULL END) AS latest_expiry
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
    GROUP BY i.id, p.product_name
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params,
        page,
        limit,
        sortBy: 'p.product_name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(`Error fetching warehouse product summary (warehouse_id: ${warehouse_id}, page: ${page}, limit: ${limit}):`, error);
    throw new AppError('Failed to fetch warehouse product summary.');
  }
};

const getWarehouseInventoryDetailsByWarehouseId = async ({ warehouse_id, page, limit }) => {
  const tableName = 'warehouse_inventory wi';
  
  const joins = [
    'JOIN warehouses w ON wi.warehouse_id = w.id',
    'JOIN inventory i ON wi.inventory_id = i.id',
    'JOIN products p ON i.product_id = p.id',
    'LEFT JOIN warehouse_inventory_lots wil ON wi.inventory_id = wil.inventory_id AND wi.warehouse_id = wil.warehouse_id',
    'LEFT JOIN warehouse_lot_status ws ON wil.status_id = ws.id',
    'LEFT JOIN users u1 ON wi.created_by = u1.id',
    'LEFT JOIN users u2 ON wi.updated_by = u2.id',
    'LEFT JOIN users u3 ON wil.created_by = u3.id',
    'LEFT JOIN users u4 ON wil.updated_by = u4.id'
  ];
  
  const whereClause = 'wi.warehouse_id = $1';
  
  // Sorting
  const defaultSort = 'p.product_name, wil.expiry_date';
  
  const baseQuery = `
    SELECT
        wi.id AS warehouse_inventory_id,
        i.id AS inventory_id,
        p.product_name,
        i.item_type,
        i.identifier,
        wil.id AS warehouse_inventory_lot_id,
        wil.lot_number,
        COALESCE(wil.quantity, 0) AS lot_quantity,
        COALESCE(wi.reserved_quantity, 0) AS reserved_stock,
        COALESCE(wi.available_quantity, 0) AS available_stock,
        COALESCE(wi.warehouse_fee, 0) AS warehouse_fees,
        COALESCE(ws.name, 'Unknown') AS lot_status,
        wil.manufacture_date,
        wil.expiry_date,
        wil.inbound_date,
        wil.outbound_date,
        wi.last_update,
        wi.created_at AS inventory_created_at,
        wi.updated_at AS inventory_updated_at,
        
        COALESCE(u1.firstname, '') || ' ' || COALESCE(u1.lastname, 'Unknown') AS inventory_created_by,
        COALESCE(u2.firstname, '') || ' ' || COALESCE(u2.lastname, 'Unknown') AS inventory_updated_by,
    
        wil.created_at AS lot_created_at,
        wil.updated_at AS lot_updated_at,
        COALESCE(u3.firstname, '') || ' ' || COALESCE(u3.lastname, 'Unknown') AS lot_created_by,
        COALESCE(u4.firstname, '') || ' ' || COALESCE(u4.lastname, 'Unknown') AS lot_updated_by
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
  `;
  
  try {
    // Use pagination if required
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [warehouse_id],
        page,
        limit,
        sortBy: defaultSort,
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    logError(`Error fetching warehouse inventory details (page: ${page}, limit: ${limit}):`, error);
    throw new AppError('Failed to fetch warehouse inventory details.');
  }
};

module.exports = {
  getWarehouseInventories,
  getWarehouseProductSummary,
  getWarehouseInventoryDetailsByWarehouseId,
};
