const { fetchAllInventories } = require('../services/inventory-service');
const wrapAsync = require('../utils/wrap-async');

const getAllInventoriesController =  wrapAsync(async (req, res, next) => {
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

module.exports = { getAllInventoriesController };
