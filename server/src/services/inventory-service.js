const { getInventories, insertInventoryRecords } = require('../repositories/inventory-repository');
const AppError = require('../utils/AppError');
const { logError, logInfo } = require('../utils/logger-helper');
const { getWarehouseLotStatus } = require('../repositories/warehouse-lot-status-repository');

/**
 * Fetch all inventory records with pagination, sorting, and business logic.
 * @param {Object} options - Query parameters.
 * @param {number} options.page - Page number.
 * @param {number} options.limit - Records per page.
 * @param {string} [options.sortBy='created_at'] - Column to sort by.
 * @param {string} [options.sortOrder='ASC'] - Sorting order.
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const fetchAllInventories = async ({ page, limit, sortBy, sortOrder }) => {
  try {
    logInfo(
      `Fetching inventory data: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`
    );

    // Fetch inventory records from repository
    const { data, pagination } = await getInventories({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // Business Logic: Mark expired items
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

/**
 * Service to create multiple inventory records and reposition them between warehouses if needed.
 * @param {Array<Object>} inventoryData - Array of inventory objects.
 * @param {string} userId - The user performing the action.
 * @returns {Promise<Object>} - Result of the operation.
 */
const createInventoryRecords = async (inventoryData, userId) => {
  try {
    // Ensure inventoryData is an array
    if (!Array.isArray(inventoryData) || inventoryData.length === 0) {
      throw new AppError('Invalid inventory data. Expected a non-empty array.');
    }
    
    const {id} = await getWarehouseLotStatus(null, { name : 'in_stock'});
    const status_id = id;
    // Prepare records for insertion
    const formattedInventory = inventoryData.map((data) => {
      const { type, identifier, product_id, location_id, quantity } = data;
      
      // Validate required fields
      if (!type || !location_id || !quantity || !status_id) {
        throw new AppError('Missing required fields in inventory record.');
      }
      
      if (type === 'product' && !product_id) {
        throw new AppError('Product must have a product_id.');
      }
      
      if (type !== 'product' && !identifier) {
        throw new AppError('Non-product items must have an identifier.');
      }
      
      if (quantity <= 0) {
        throw new AppError('Quantity must be greater than zero.');
      }
      
      return {
        inventoryId: null, // Let the repository handle ID generation
        type,
        identifier: type !== 'product' ? identifier : null,
        product_id: type === 'product' ? product_id : null,
        location_id,
        quantity,
        status_id,
        created_by: userId,
      };
    });
    
    // Insert records using repository function
    const result = await insertInventoryRecords(formattedInventory);
    console.log("serveice resulte: ",result);
    if (result.length === 0) {
      throw new AppError('Failed to create inventory records.');
    }
    
    if (!result.success) {
      throw new AppError('Failed to create inventory records.');
    }
    
    return { success: true, message: 'Inventory records successfully created.', data: result.data };
  } catch (error) {
    logError('Error in inventory service:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  fetchAllInventories,
  createInventoryRecords,
};
