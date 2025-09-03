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
 * @summary Review inventory allocations for a specific order.
 * @description
 * Retrieves detailed review data for inventory allocations tied to a given order.
 *
 * Request behavior:
 * - Expects `orderId` as a route parameter.
 * - Requires a request body with:
 *   - `warehouseIds`: Array of UUIDs (required).
 *   - `allocationIds`: Array of UUIDs (required).
 *
 * Notes:
 * - POST is used instead of GET to support large request bodies and avoid URL length limits.
 * - Authorization is enforced using `PERMISSIONS.INVENTORY.REVIEW_ALLOCATION`.
 * - Input validation and sanitization are applied to all incoming data.
 *
 * Middleware:
 * - `authorize` – verifies permission.
 * - `sanitizeFields` – cleans known array fields like `allocationIds`.
 * - `validate` – validates `orderId` param and body schema.
 *
 * @permission PERMISSIONS.INVENTORY.REVIEW_ALLOCATION
 *
 * @param {string} req.params.orderId - UUID of the order to review allocations for.
 * @param {string[]} req.body.warehouseIds - Required list of warehouse UUIDs to filter by.
 * @param {string[]} req.body.allocationIds - Required list of allocation UUIDs to review.
 *
 * @returns {200} { success: true, data: { header, items }, message, allocationCount }
 * @returns {400} If input validation fails.
 * @returns {403} If the user lacks permission.
 * @returns {404} If no matching allocations are found.
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
