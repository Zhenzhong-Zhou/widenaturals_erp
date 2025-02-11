const { adjustWarehouseInventory } = require('../services/warehouse-inventory-lot-service');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * API route to adjust inventory.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
async function adjustWarehouseInventoryLotsController(req, res, next) {
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
        return AppError.validationError(`Invalid adjustment record: ${JSON.stringify(record)}`);
      }
    }
    
    // Call service layer
    const { data } = await adjustWarehouseInventory(records, userId);
    
    return res.status(200).json({
      message: 'Warehouse inventory adjusted successfully',
      success: true,
      data
    });
  } catch (error) {
    logError('Error in adjustWarehouseInventoryLotsController:', error.message);
    next(error);
  }
}

module.exports = {
  adjustWarehouseInventoryLotsController,
};
