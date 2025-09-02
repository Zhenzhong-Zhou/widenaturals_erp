const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { orderIdParamSchema } = require('../validators/order-validators');
const {
  allocateInventorySchema,
  allocationReviewSchema
} = require('../validators/inventory-allocation-validators');
const {
  allocateInventoryForOrderController,
  reviewInventoryAllocationController,
  confirmInventoryAllocationController,
} = require('../controllers/inventory-allocation-controller');
const { sanitizeFields } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * @route POST /inventory-allocation/allocate/:orderId
 * @permission INVENTORY.ALLOCATE_INVENTORY
 * @description
 * Allocates available inventory to all items in a given sales order.
 *
 * Validates:
 * - `orderId` as a UUID from route params.
 * - `strategy` (4-character string, default: 'fefo') and `warehouseId` (UUID) from request body.
 *
 * Middleware:
 * - `authorize`: Requires ALLOCATE_INVENTORY permission.
 * - `validate`: Checks both route params and request body against Joi schemas.
 *
 * Controller:
 * - `allocateInventoryForOrderController`: Executes allocation logic and responds with allocation results.
 */
router.post(
  '/allocate/:orderId',
  authorize([PERMISSIONS.INVENTORY.ALLOCATE_INVENTORY]),
  validate(orderIdParamSchema, 'params'),
  validate(allocateInventorySchema, 'body'),
  allocateInventoryForOrderController
);

/**
 * @route POST /inventory-allocations/review/:orderId
 * @description
 * Retrieve and review inventory allocation details for a specific order.
 *
 * This endpoint:
 * - Accepts an `orderId` as a URL parameter.
 * - Optionally accepts `allocationIds` (array of UUIDs) in the request body to filter the review to specific allocations.
 * - Performs permission checks, request validation, and input sanitization.
 * - Returns detailed review data for allocations tied to the order.
 *
 * This route uses `POST` instead of `GET` to allow sending large arrays in the request body without exceeding URL length limits.
 *
 * @permission PERMISSIONS.INVENTORY.REVIEW_ALLOCATION
 *
 * @param {string} req.params.orderId - UUID of the order to review allocations for.
 * @param {string[]} [req.body.allocationIds] - Optional list of allocation UUIDs to filter the review.
 *
 * @returns {200} Review data for the specified allocations.
 * @returns {404} If no matching allocations are found.
 * @returns {403} If user lacks permissions.
 * @returns {400} If validation fails.
 */
router.post(
  '/review/:orderId',
  authorize([PERMISSIONS.INVENTORY.REVIEW_ALLOCATION]),
  sanitizeFields(['allocationIds']),
  validate(orderIdParamSchema, 'params'),
  validate(allocationReviewSchema, 'body'),
  reviewInventoryAllocationController
);

/**
 * POST /inventory-allocation/confirm/:orderId
 *
 * Confirms inventory allocation for a specific order.
 *
 * This route:
 * - Requires `ALLOCATE_INVENTORY` permission.
 * - Validates the `orderId` route parameter.
 * - Locks the order and its items.
 * - Updates item statuses based on matched allocation.
 * - Updates order status if all items are successfully allocated.
 * - Updates warehouse inventory and logs the action.
 *
 * Access Control:
 * - Only users with `PERMISSIONS.INVENTORY.ALLOCATE_INVENTORY` can invoke this action.
 *
 * Validation:
 * - `params.orderId` must be a valid UUID (validated via `orderIdParamSchema`).
 *
 * Response:
 * - `200 OK` with allocation result (transformed order allocation response)
 * - Errors are handled via global middleware and may include:
 *   - `403 Forbidden` (insufficient permissions)
 *   - `404 Not Found` (order or items not found)
 *   - `500 Internal Server Error` (unexpected failure during confirmation)
 */
router.post(
  '/confirm/:orderId',
  authorize([PERMISSIONS.INVENTORY.ALLOCATE_INVENTORY]),
  validate(orderIdParamSchema, 'params'),
  confirmInventoryAllocationController
);

module.exports = router;
