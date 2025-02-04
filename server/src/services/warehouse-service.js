const { getWarehouses } = require('../repositories/warehouse-repository');
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

module.exports = {
  fetchAllWarehouses,
}