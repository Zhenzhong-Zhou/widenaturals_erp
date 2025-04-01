const {
  fetchAllWarehouseInventories,
  fetchWarehouseProductSummary,
  fetchWarehouseInventoryDetailsByWarehouseId,
} = require('../services/warehouse-inventory-service');
const { logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to fetch all warehouse inventories with pagination, sorting, and filtering.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param next
 */
const getAllWarehouseInventoriesController = wrapAsync(
  async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sortBy, sortOrder } = req.query;

      const { data, pagination } = await fetchAllWarehouseInventories({
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder,
      });
      
      res.status(200).json({
        success: true,
        message: 'Warehouse inventories retrieved successfully',
        data,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Controller to fetch warehouse inventory for a specific warehouse.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getWarehouseInventoryByWarehouse = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    const { page = 1, limit = 10, sortBy, sortOrder } = req.query;

    // const inventories = await warehouseInventoryService.fetchWarehouseInventoryByWarehouse(
    //   warehouseId,
    //   { page: Number(page), limit: Number(limit), sortBy, sortOrder }
    // );
    //
    // res.status(200).json({
    //   success: true,
    //   message: `Inventories for warehouse ${warehouseId} retrieved successfully`,
    //   data: inventories.data,
    //   pagination: inventories.pagination,
    // });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get warehouse product summary.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param next
 * @returns {Promise<void>}
 */
const getWarehouseProductSummaryController = wrapAsync(
  async (req, res, next) => {
    try {
      const { warehouse_id } = req.params; // Get warehouse ID from URL params
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      // Call the service function
      const { productSummaryData, pagination } =
        await fetchWarehouseProductSummary(warehouse_id, page, limit);

      // Return the response
      return res.status(200).json({
        success: true,
        message: 'Warehouse product summary retrieved successfully.',
        productSummaryData,
        pagination,
      });
    } catch (error) {
      logError('Error in getWarehouseProductSummaryController:', error);
      next(error);
    }
  }
);

/**
 * Controller to get warehouse inventory details by warehouse ID.
 * @route GET /api/warehouse-inventory/:warehouse_id
 * @access Protected
 */
const getWarehouseInventoryDetailsController = wrapAsync(async (req, res) => {
  const { warehouse_id } = req.params;
  const { page = 1, limit = 10 } = req.query; // Default pagination values

  // Fetch inventory details from service
  const { inventoryDetails, pagination } =
    await fetchWarehouseInventoryDetailsByWarehouseId(
      warehouse_id,
      parseInt(page, 10),
      parseInt(limit, 10)
    );

  // Send JSON response
  res.status(200).json({
    success: true,
    message: 'Warehouse inventory details retrieved successfully.',
    inventoryDetails,
    pagination,
  });
});

module.exports = {
  getAllWarehouseInventoriesController,
  getWarehouseProductSummaryController,
  getWarehouseInventoryDetailsController,
};
