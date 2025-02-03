const { getInventories } = require('../repositories/inventory-repository');
const AppError = require('../utils/AppError');
const { logError, logInfo } = require('../utils/logger-helper');

/**
 * Fetch all inventory records with pagination, sorting, and business logic.
 * @param {Object} options - Query parameters.
 * @param {number} options.page - Page number.
 * @param {number} options.limit - Records per page.
 * @param {string} [options.sortBy='created_at'] - Column to sort by.
 * @param {string} [options.sortOrder='ASC'] - Sorting order.
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const fetchAllInventories = async ({ page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'ASC' }) => {
  try {
    logInfo(`Fetching inventory data: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`);
    
    // Fetch inventory records from repository
    const { data, pagination } = await getInventories({ page, limit, sortBy, sortOrder });
    
    // 🔥 Business Logic: Mark expired items
    const processedData = data.map((item) => ({
      ...item,
      is_expired: item.expiry_date && new Date(item.expiry_date) < new Date(), // If expiry_date is in the past, mark as expired
      warehouse_fee: parseFloat(item.warehouse_fee) || 0, // Ensure warehouse_fee is always a number
    }));
    
    return { processedData, pagination };
  } catch (error) {
    logError('Error fetching inventory:', error);
    throw new AppError('Failed to fetch inventory', 500);
  }
};

module.exports = {
  fetchAllInventories,
};
