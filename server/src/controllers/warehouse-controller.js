const wrapAsync = require('../utils/wrap-async');
const { fetchAllWarehouses } = require('../services/warehouse-service');

/**
 * @desc Fetch all warehouses with pagination, sorting, and filtering
 * @route GET /api/warehouses
 * @access Protected
 */
const getAllWarehousesController = wrapAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  
  // Call service function
  const { warehouses, pagination } = await fetchAllWarehouses({
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouses retrieved successfully',
    warehouses,
    pagination,
  });
});

module.exports = {
  getAllWarehousesController,
};
