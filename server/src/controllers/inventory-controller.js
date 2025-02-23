const { fetchAllInventories, createInventoryRecords } = require('../services/inventory-service');
const wrapAsync = require('../utils/wrap-async');
const { logError } = require('../utils/logger-helper');
const { getUser } = require('../repositories/user-repository');

const getAllInventoriesController = wrapAsync(async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;

    const { processedData, pagination } = await fetchAllInventories({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      message: 'Inventory data fetched successfully',
      processedData,
      pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Express route handler to reposition inventory (handles both single and bulk insert).
 */
const createInventoryRecordsController = wrapAsync(async (req, res, next) => {
  try {
    const { inventoryData } = req.body;
    console.log(inventoryData);
    // const userId = req.user.id; // Extract from auth middleware
    const result = await getUser(null, 'email', 'root@widenaturals.com');
    const userId= result.id;
    console.log(userId)
    const { success, message, data, warehouseLots } = await createInventoryRecords(inventoryData, userId);
    
    if (!success) {
      return res.status(400).json({ success, message, warehouseLots });
    }
    
    return res.status(201).json({ success: true, message, data });
  } catch (error) {
    logError('Controller error:', error.message);
    next(error);
  }
});

module.exports = {
  getAllInventoriesController,
  createInventoryRecordsController,
};
