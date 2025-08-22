const wrapAsync = require('../utils/wrap-async');
const { allocateInventoryForOrder } = require('../services/inventory-allocation-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller: allocateInventoryForOrderController
 *
 * Allocates inventory for a given sales order based on the selected warehouse and allocation strategy.
 *
 * This controller is responsible for:
 * - Validating the `orderId` from route params (must be a UUID).
 * - Extracting allocation parameters (`strategy`, `warehouseId`) from the request body.
 * - Delegating to the `allocateInventoryForOrder` service function.
 * - Logging the result of the allocation.
 * - Returning a JSON response with allocation details.
 *
 * Allocation strategy can be:
 * - `fefo`: First-Expire, First-Out (default)
 * - `fifo`: First-In, First-Out
 *
 * Example Request:
 * PATCH /inventory/allocate/:orderId
 * Body: { "strategy": "fefo", "warehouseId": "..." }
 *
 * Example Success Response:
 * {
 *   "success": true,
 *   "message": "Inventory allocation complete",
 *   "data": {
 *     "allocations": [...],
 *     "summary": { fulfilled: true, partial: false, ... }
 *   }
 * }
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 */
const allocateInventoryForOrderController = wrapAsync(async (req, res) => {
  const { orderId } = req.params;
  const { strategy, warehouseId } = req.body;
  const user = req.user;
  
  const result = await allocateInventoryForOrder(user, orderId, { strategy, warehouseId } );
  
  logInfo('Inventory allocated successfully', req, {
    context: 'inventory-allocation-controller/allocateInventoryForOrderController',
    orderId,
    userId: user?.id,
    severity: 'INFO',
  });
  
  return res.status(200).json({
    success: true,
    message: 'Inventory allocation complete',
    data: result,
  });
});

module.exports = {
  allocateInventoryForOrderController,
};
