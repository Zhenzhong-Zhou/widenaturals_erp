const { allocateMultipleInventoryItems } = require('../services/inventory-allocation-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');

/**
 * Controller to handle inventory allocation for an order.
 * @route POST /orders/:orderId/allocate
 */
const allocateMultipleInventoryItemsController = wrapAsync(async (req, res, next) => {
  try {
    const { order_id } = req.params;
    const { strategy: defaultStrategy = 'FEFO', items } = req.body;
    
    const userId = req.user.id;
    
    if (!order_id || !items || !Array.isArray(items) || items.length === 0) {
      throw AppError.validationError('Order ID and at least one allocation item are required.');
    }
    
    // Delegate allocation to service
    const allocations = await allocateMultipleInventoryItems({
      orderId: order_id,
      items,
      userId,
      defaultStrategy,
    });
    
    res.status(201).json({
      success: true,
      message: 'Inventory allocation completed successfully.',
      allocations,
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = {
  allocateMultipleInventoryItemsController,
};
