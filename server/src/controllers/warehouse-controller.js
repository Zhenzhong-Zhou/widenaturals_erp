const wrapAsync = require('../utils/wrap-async');
const {
  fetchAllWarehouses,
  fetchWarehouseInventorySummary,
} = require('../services/warehouse-service');

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

const getWarehouseInventorySummaryController = wrapAsync(
  async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const { formattedSummary, pagination } =
        await fetchWarehouseInventorySummary({
          page: page ? parseInt(page, 10) : undefined,
          limit: limit ? parseInt(limit, 10) : undefined,
          statusFilter: status || 'active',
        });

      res.status(200).json({
        success: true,
        message: 'Warehouse inventory overview retrieved successfully',
        formattedSummary,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = {
  getAllWarehousesController,
  getWarehouseInventorySummaryController,
};
