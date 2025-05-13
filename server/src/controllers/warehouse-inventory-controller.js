const {
  fetchAllWarehouseInventories,
  fetchWarehouseItemSummary,
  fetchWarehouseInventoryDetailsByWarehouseId, fetchPaginatedWarehouseInventoryItemSummary,
} = require('../services/warehouse-inventory-service');
const { logError } = require('../utils/logger-helper');
const wrapAsync = require('../utils/wrap-async');
const { logSystemInfo } = require('../utils/system-logger');

/**
 * Controller: Handles GET request to fetch paginated warehouse inventory summary.
 *
 * This controller:
 * - Extracts pagination query parameters (`page`, `limit`, `itemType`) and the authenticated user
 * - Calls the service layer to fetch product or material inventory summary from warehouse inventory
 * - Logs the access for audit traceability
 * - Returns structured JSON response with inventory data and pagination info
 *
 * @route GET /api/v1/warehouse-inventory/summary
 * @access Protected
 *
 * @param {object} req - Express request object, with `query.page`, `query.limit`, `query.itemType`, and `user`
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const getPaginatedWarehouseInventorySummaryController = wrapAsync(async (req, res) => {
  const { page, limit, itemType } = req.query;
  const user = req.user;
  
  const { data, pagination } = await fetchPaginatedWarehouseInventoryItemSummary({
    page,
    limit,
    itemType,
    user,
  });
  
  logSystemInfo('Paginated warehouse inventory summary fetched', {
    context: 'warehouse-inventory-controller',
    userId: user.id,
    page,
    limit,
  });
  
  res.status(200).json({
    success: true,
    message: 'Warehouse inventory summary fetched successfully.',
    data,
    pagination,
  });
});

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
 * Controller to get warehouse items.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param next
 * @returns {Promise<void>}
 */
const getWarehouseItemSummaryController = wrapAsync(async (req, res, next) => {
  try {
    const { warehouse_id } = req.params; // Get warehouse ID from URL params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Call the updated service
    const { itemSummaryData, pagination } = await fetchWarehouseItemSummary(
      warehouse_id,
      page,
      limit
    );

    // Return the response
    return res.status(200).json({
      success: true,
      message: 'Warehouse items retrieved successfully.',
      itemSummaryData,
      pagination,
    });
  } catch (error) {
    logError('Error in getWarehouseItemsController:', error);
    next(error);
  }
});

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
  getPaginatedWarehouseInventorySummaryController,
  getAllWarehouseInventoriesController,
  getWarehouseItemSummaryController,
  getWarehouseInventoryDetailsController,
};
