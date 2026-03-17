const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  allocateInventoryForOrderService,
  reviewInventoryAllocationService,
  confirmInventoryAllocationService,
  fetchPaginatedInventoryAllocationsService,
} = require('../services/inventory-allocation-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller: allocateInventoryForOrderController
 *
 * Initiates automatic inventory allocation for a given order.
 *
 * This controller:
 * - Validates the `orderId` route parameter (UUID).
 * - Extracts allocation parameters (`strategy`, `warehouseId`, `allowPartial`)
 *   from the request body.
 * - Delegates the allocation process to `allocateInventoryForOrderService`.
 * - Returns allocation identifiers used for the allocation review step.
 *
 * Allocation strategies:
 * - `fefo` → First-Expire, First-Out (default)
 * - `fifo` → First-In, First-Out
 *
 * Partial allocation workflow:
 * 1. The client typically sends an allocation request without `allowPartial`.
 * 2. If the warehouse has inventory but not enough to satisfy all items,
 *    the service returns a validation error (`INSUFFICIENT_INVENTORY`)
 *    with shortage details.
 * 3. The UI prompts the user to confirm partial allocation.
 * 4. The client retries the request with `allowPartial: true`.
 * 5. The service allocates all available inventory batches.
 *
 * If no inventory exists in the selected warehouse for some items,
 * the service returns a `NO_WAREHOUSE_INVENTORY` validation error.
 *
 * Example Request:
 * POST /inventory-allocations/allocate/:orderId
 *
 * Body:
 * {
 *   "strategy": "fefo",
 *   "warehouseId": "123e4567-e89b-12d3-a456-426614174000",
 *   "allowPartial": false
 * }
 *
 * Example Success Response:
 * {
 *   "success": true,
 *   "message": "Inventory allocation created successfully",
 *   "data": {
 *     "orderId": "...",
 *     "allocationIds": ["...", "..."]
 *   }
 * }
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 */
const allocateInventoryForOrderController = wrapAsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { strategy, warehouseId, allowPartial } = req.body;
  const user = req.auth.user;

  const result = await allocateInventoryForOrderService(user, orderId, {
    strategy,
    warehouseId,
    allowPartial,
  });

  logInfo('Inventory allocated successfully', req, {
    context:
      'inventory-allocation-controller/allocateInventoryForOrderController',
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
 * Review Inventory Allocation Controller
 *
 * Handles reviewing inventory allocations for a specific order.
 *
 * Behavior:
 * - Expects `orderId` as a route parameter.
 * - Accepts an optional array of `allocationIds` (UUIDs) and `warehouseIds` in the request body to filter allocations.
 * - Delegates to the service layer to validate access, fetch relevant data, and transform the response.
 * - Returns a structured payload including order metadata and item-level allocation details.
 *
 * Notes:
 * - Route-level authorization is enforced via `PERMISSIONS.INVENTORY.REVIEW_ALLOCATION`.
 * - Responds with 404 if no allocations are found.
 * - Uses POST to support large filter payloads.
 *
 * @route POST /inventory-allocations/review/:orderId
 * @permission PERMISSIONS.INVENTORY.REVIEW_ALLOCATION
 *
 * @async
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 *
 * @returns {Promise<void>} Sends JSON response with review data or error message
 */
const reviewInventoryAllocationController = wrapAsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { warehouseIds = [], allocationIds = [] } = req.body;

  const logMeta = {
    context: 'inventory/reviewInventoryAllocationController',
    orderId,
    allocationIds,
    user: req.auth.user?.id,
  };

  const reviewData = await reviewInventoryAllocationService(
    orderId,
    warehouseIds,
    allocationIds
  );

  if (!reviewData) {
    logInfo('No inventory allocations found', req, logMeta);
    return res.status(404).json({
      success: false,
      message: 'No inventory allocations found for review',
    });
  }

  const allocationCount = reviewData?.items?.length ?? 0;

  logInfo('Inventory allocation review retrieved successfully', req, {
    ...logMeta,
    allocationCount,
  });

  return res.status(200).json({
    success: true,
    message: 'Inventory allocation review retrieved successfully',
    data: reviewData,
    allocationCount,
  });
});

/**
 * Controller to fetch a paginated list of inventory allocation summaries.
 *
 * Accepts query parameters (already normalized via middleware) to control
 * filtering, pagination, and sorting behavior.
 *
 * Delegates the core logic to `fetchPaginatedInventoryAllocationsService`, which:
 * - Applies SQL-level filtering (allocation/order/payment-related)
 * - Transforms raw rows into client-friendly format
 * - Returns pagination metadata
 *
 * ### Query Parameters (via `req.normalizedQuery`):
 * - `page` (number): Page number (1-based)
 * - `limit` (number): Items per page
 * - `sortBy` (string): Column key to sort by (e.g., `created_at`)
 * - `sortOrder` (string): 'ASC' or 'DESC'
 * - `filters` (object): Dynamic filters (e.g., warehouseId, orderStatusId, keyword, etc.)
 *
 * ### Response: 200 OK
 * ```json
 * {
 *   "success": true,
 *   "message": "Inventory allocations retrieved successfully.",
 *   "data": InventoryAllocationSummary[],
 *   "pagination": {
 *     "page": number,
 *     "limit": number,
 *     "totalRecords": number,
 *     "totalPages": number
 *   }
 * }
 * ```
 *
 * @route GET /api/inventory-allocations
 * @access Protected
 */
const getPaginatedInventoryAllocationsController = wrapAsyncHandler(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    // Step 1: Fetch transformed paginated results from service
    const { data, pagination } =
      await fetchPaginatedInventoryAllocationsService({
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      });

    // Step 2: Return 200 response
    res.status(200).json({
      success: true,
      message: 'Inventory allocations retrieved successfully.',
      data,
      pagination,
    });
  }
);

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
 * - `req.auth.user`: Authenticated user object injected by auth middleware.
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
const confirmInventoryAllocationController = wrapAsyncHandler(async (req, res) => {
  const rawOrderId = req.params.orderId;
  const user = req.auth.user;

  logInfo('Received inventory allocation confirmation request', req, {
    context:
      'inventory-allocation-controller/confirmInventoryAllocationController',
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
  reviewInventoryAllocationController,
  getPaginatedInventoryAllocationsController,
  confirmInventoryAllocationController,
};
