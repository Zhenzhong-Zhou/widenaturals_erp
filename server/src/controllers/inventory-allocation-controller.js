const wrapAsync = require('../utils/wrap-async');
const {
  allocateInventoryForOrderService,
  // reviewInventoryAllocationService,
  confirmInventoryAllocationService
} = require('../services/inventory-allocation-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller: allocateInventoryForOrderController
 *
 * Allocates inventory for a given sales order based on the selected warehouse and allocation strategy.
 *
 * This controller is responsible for:
 * - Validating the `orderId` from route params (must be a UUID).
 * - Extracting allocation parameters (`strategy`, `warehouseId`) from the request body.
 * - Delegating to the `allocateInventoryForOrderService` service function.
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
  
  const result = await allocateInventoryForOrderService(user, orderId, { strategy, warehouseId } );
  
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

// /**
//  * Controller to handle inventory allocation review for a specific order.
//  *
//  * This controller:
//  * - Expects `orderId` as a URL parameter.
//  * - Optionally accepts `allocationIds` (array of UUIDs) in the request body to filter specific allocations.
//  * - Calls the service to validate allocation ownership, fetch allocation data, and transform it.
//  * - Returns a structured response containing header and allocation item data.
//  *
//  * Notes:
//  * - Route-level authorization is assumed (PERMISSIONS.ALLOCATION.REVIEW).
//  * - Returns 404 if no allocations exist for the given order or filters.
//  *
//  * @route GET /inventory-allocations/review/:orderId
//  * @permission PERMISSIONS.ALLOCATION.REVIEW
//  *
//  * @async
//  *
//  * @param {import('express').Request} req - Express request object.
//  * @param {import('express').Response} res - Express response object.
//  * @param {import('express').NextFunction} next - Express next middleware function.
//  *
//  * @returns {Promise<void>} - Responds with JSON result or error.
//  */
// const reviewInventoryAllocationController = wrapAsync( async (req, res) => {
//   const { orderId } = req.params;
//   const { allocationIds = [] } = req.body;
//
//   const reviewData = await reviewInventoryAllocationService(orderId, allocationIds);
//
//   if (!reviewData) {
//     return res.status(404).json({
//       success: false,
//       message: 'No inventory allocations found for review',
//     });
//   }
//
//   return res.status(200).json({
//     success: true,
//     message: 'Inventory allocation review retrieved successfully',
//     data: reviewData,
//   });
// });

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
  
  const result = await confirmInventoryAllocationService(user, rawOrderId);
  
  res.status(200).json({
    success: true,
    message: 'Inventory allocation confirmed successfully',
    data: result,
  });
});

module.exports = {
  allocateInventoryForOrderController,
  // reviewInventoryAllocationController,
  confirmInventoryAllocationController,
};
