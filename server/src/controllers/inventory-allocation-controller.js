const wrapAsync = require('../utils/wrap-async');
const { allocateInventoryForOrder, confirmInventoryAllocation } = require('../services/inventory-allocation-service');
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

/**
 * Controller: Confirm inventory allocation for a specific order.
 *
 * Route: POST /inventory-allocation/confirm/:orderId
 *
 * This controller:
 * - Assumes the user has already passed authorization middleware (`ALLOCATE_INVENTORY` permission).
 * - Validates the `orderId` param (via middleware).
 * - Calls the inventory allocation confirmation service within a transaction.
 * - Transforms and returns the confirmed allocation result.
 *
 * Expected input:
 * - `req.params.orderId`: UUID of the order to confirm allocation for.
 * - `req.user`: Authenticated user object injected by auth middleware.
 *
 * Success Response (200 OK):
 * {
 *   success: true,
 *   message: 'Inventory allocation confirmed successfully',
 *   data: { ...transformedAllocationResult }
 * }
 *
 * Errors:
 * - 403 Forbidden: If route-level permission check fails
 * - 404 Not Found: If order or items not found
 * - 500 Internal Server Error: For unexpected service failures
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const confirmInventoryAllocationController = wrapAsync(async (req, res) => {
  const rawOrderId = req.params.orderId;
  const user = req.user;
  
  logInfo('Received inventory allocation confirmation request', {
    context: 'inventory-allocation-controller/confirmInventoryAllocationController',
    orderId: rawOrderId,
    userId: user?.id,
  });
  
  const result = await confirmInventoryAllocation(user, rawOrderId);
  
  res.status(200).json({
    success: true,
    message: 'Inventory allocation confirmed successfully',
    data: result,
  });
});

module.exports = {
  allocateInventoryForOrderController,
  confirmInventoryAllocationController,
};
