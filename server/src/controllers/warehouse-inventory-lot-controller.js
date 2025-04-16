const {
  adjustWarehouseInventory,
} = require('../services/warehouse-inventory-lot-service');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const {
  fetchRecentInsertWarehouseInventoryRecords,
} = require('../services/inventory-service');
const { getAvailableInventoryLotsForClient } = require('../business/warehouse-inventory-lot-business');

/**
 * API route to adjust inventory.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const adjustWarehouseInventoryLotsController = wrapAsync(
  async (req, res, next) => {
    try {
      let records = [];

      if (req.params.id) {
        // Single adjustment (convert to array for consistency)
        records = [{ warehouse_inventory_id: req.params.id, ...req.body }];
      } else if (Array.isArray(req.body)) {
        // Bulk adjustment
        records = req.body;
      } else {
        return AppError.validationError('Invalid request format');
      }

      const userId = req.user.id; // User making the request

      // Validate records before processing
      for (const record of records) {
        if (
          !record.warehouse_inventory_id ||
          !record.adjustment_type_id ||
          typeof record.adjusted_quantity !== 'number' ||
          record.adjusted_quantity === 0
        ) {
          logError(
            `Invalid adjustment record received: ${JSON.stringify(record)}`
          );
          return next(
            AppError.validationError(
              `Invalid adjustment record: ${JSON.stringify(record)}`
            )
          );
        }
      }

      // Call service layer
      const { data } = await adjustWarehouseInventory(records, userId);

      return res.status(200).json({
        message: 'Warehouse inventory adjusted successfully',
        success: true,
        data,
      });
    } catch (error) {
      logError(
        'Error in adjustWarehouseInventoryLotsController:',
        error.message
      );
      next(error);
    }
  }
);

const insertInventoryRecordResponseController = wrapAsync(
  async (req, res, next) => {
    try {
      const { warehouseLotIds } = req.body;

      const inventoryRecords =
        await fetchRecentInsertWarehouseInventoryRecords(warehouseLotIds);

      return res.json({ success: true, data: inventoryRecords });
    } catch (error) {
      logError('Error fetching grouped warehouse inventory:', error);
      next(error);
    }
  }
);

/**
 * Controller: Returns available inventory lots for a given inventory ID.
 *
 * @route GET /api/v1/warehouse-inventory-lots/inventory/:inventoryId/lots
 * @query warehouseId, strategy (optional)
 */
const getAvailableInventoryLotsController = wrapAsync(async (req, res, next) => {
  try {
    const { inventoryId } = req.params;
    const { warehouseId, strategy = 'FEFO' } = req.query;
    
    if (!inventoryId) {
      throw AppError.validationError('Missing inventory ID in request.');
    }
    
    const lots = await getAvailableInventoryLotsForClient({
      inventoryId,
      warehouseId: warehouseId || null,
      strategy,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Available inventory lots retrieved successfully.',
      data: lots,
    });
  } catch (error) {
    next(error); // centralized error handler middleware will handle this
  }
});

module.exports = {
  adjustWarehouseInventoryLotsController,
  insertInventoryRecordResponseController,
  getAvailableInventoryLotsController,
};
