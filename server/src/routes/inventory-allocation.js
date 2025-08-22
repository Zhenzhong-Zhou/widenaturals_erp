const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { allocateOrderIdSchema, allocateInventorySchema } = require('../validators/inventory-allocation-validators');
const { allocateInventoryForOrderController } = require('../controllers/inventory-allocation-controller');

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

module.exports = router;
