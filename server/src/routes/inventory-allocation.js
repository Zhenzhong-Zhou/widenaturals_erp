const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { allocateOrderIdSchema, allocateInventorySchema } = require('../validators/inventory-allocation-validators');
const { allocateInventoryForOrderController, confirmInventoryAllocationController } = require('../controllers/inventory-allocation-controller');

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
  validate(allocateOrderIdSchema, 'params'),
  validate(allocateInventorySchema, 'body'),
  allocateInventoryForOrderController
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
 * - `params.orderId` must be a valid UUID (validated via `allocateOrderIdSchema`).
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
  validate(allocateOrderIdSchema, 'params'),
  confirmInventoryAllocationController
);

module.exports = router;
