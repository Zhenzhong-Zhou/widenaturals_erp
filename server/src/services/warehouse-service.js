const { getWarehouses, getWarehouseInventorySummary } = require('../repositories/warehouse-repository');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const fetchAllWarehouses = async ({ page, limit, sortBy, sortOrder }) => {
  try {
    logInfo('Fetching warehouses with pagination...');
    
    // **Ensure valid pagination input**
    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    sortBy = sortBy || 'name';
    sortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    
    // **Retrieve warehouse data**
    const { data, pagination } = await getWarehouses({ page, limit, sortBy, sortOrder });
    
    // **Apply business logic** (e.g., filtering warehouses with zero storage capacity)
    const filteredWarehouses = data.filter(wh => wh.storage_capacity > 0);
    
    return {
      warehouses: filteredWarehouses,
      pagination,
    };
  } catch (error) {
    logError('Error fetching warehouses:', error);
    throw new AppError('Failed to retrieve warehouses');
  }
};

/**
 * Service to get warehouse inventory summary with business logic.
 *
 * @param {Object} options - Query parameters
 * @param {number} options.page - Pagination page number (optional)
 * @param {number} options.limit - Number of records per page (optional)
 * @param {string} options.statusFilter - Warehouse status filter ('active', 'inactive', 'all') (default: 'active')
 * @returns {Promise<Object>} Warehouse inventory summary response
 */
const fetchWarehouseInventorySummary = async ({ page, limit, statusFilter = 'active' }) => {
  try {
    // Validate status filter input
    const allowedStatuses = ['active', 'inactive', 'all'];
    if (!allowedStatuses.includes(statusFilter)) {
      throw new AppError(`Invalid statusFilter: '${statusFilter}'. Allowed: ${allowedStatuses.join(', ')}`, 400);
    }
    
    // Fetch warehouse inventory overview from repository
    const { data, pagination } = await getWarehouseInventorySummary({ page, limit, statusFilter });
    
    // Transform response (Example: Add computed fields if needed)
    const formattedSummary = data.map(warehouse => ({
      warehouseId: warehouse.warehouse_id,
      warehouseName: warehouse.warehouse_name,
      status: warehouse.status_name,
      totalProducts: warehouse.total_products || 0,
      totalReservedStock: warehouse.total_reserved_stock || 0,
      totalAvailableStock: warehouse.total_available_stock || 0,
      totalWarehouseFees: warehouse.total_warehouse_fees || 0,
      lastInventoryUpdate: warehouse.last_inventory_update,
      totalLots: warehouse.total_lots || 0,
      earliestExpiry: warehouse.earliest_expiry || 'N/A',
      latestExpiry: warehouse.latest_expiry || 'N/A',
    }));
    
    return {
      formattedSummary,
      pagination,
    };
  } catch (error) {
    console.error('Error in getWarehouseInventorySummary:', error);
    throw new AppError('Failed to retrieve warehouse inventory summary.', 500);
  }
};

module.exports = {
  fetchAllWarehouses,
  fetchWarehouseInventorySummary,
}