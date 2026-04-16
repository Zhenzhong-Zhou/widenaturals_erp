/**
 * @file inventory-allocations.js
 * @description Inventory allocation routes for order-based allocation, review,
 * confirmation, and paginated allocation queries.
 *
 * Routes:
 *   POST  /allocate/:orderId  — allocate inventory batches against an order
 *   POST  /review/:orderId    — retrieve allocation review data for an order
 *   GET   /                  — paginated allocation list with filtering and sorting
 *   PATCH /confirm/:orderId   — confirm a pending allocation for an order
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS                        = require('../utils/constants/domain/permission-keys');
const { orderIdParamSchema }             = require('../validators/order-validators');
const {
  allocateInventorySchema,
  allocationReviewSchema,
  inventoryAllocationsQuerySchema,
} = require('../validators/inventory-allocation-validators');
const {
  allocateInventoryForOrderController,
  reviewInventoryAllocationController,
  getPaginatedInventoryAllocationsController,
  confirmInventoryAllocationController,
} = require('../controllers/inventory-allocation-controller');

const router = express.Router();

/**
 * @route POST /inventory-allocations/allocate/:orderId
 * @description Allocate available inventory against a specific order.
 * Validates the order ID and allocation payload before delegating to the controller.
 * @access protected
 * @permission PERMISSION_KEYS.INVENTORY_ALLOCATION.ALLOCATE
 */
router.post(
  '/allocate/:orderId',
  authorize([PERMISSION_KEYS.INVENTORY_ALLOCATION.ALLOCATE]),
  validate(orderIdParamSchema, 'params'),
  validate(allocateInventorySchema, 'body'),
  allocateInventoryForOrderController
);

/**
 * @route POST /inventory-allocations/review/:orderId
 * @description Submit a review decision on a pending inventory allocation for an order.
 * @access protected
 * @permission PERMISSION_KEYS.INVENTORY_ALLOCATION.REVIEW
 */
router.post(
  '/review/:orderId',
  authorize([PERMISSION_KEYS.INVENTORY_ALLOCATION.REVIEW]),
  validate(orderIdParamSchema, 'params'),
  validate(allocationReviewSchema, 'body'),
  reviewInventoryAllocationController
);

/**
 * @route GET /inventory-allocations
 * @description Paginated inventory allocation records with optional filters and sorting.
 * Filters: statusIds, warehouseIds, batchIds.
 * Sorting: sortBy, sortOrder (uses inventoryAllocationSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.INVENTORY_ALLOCATION.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.INVENTORY_ALLOCATION.VIEW]),
  validate(inventoryAllocationsQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'inventoryAllocationSortMap',                  // moduleKey — drives allowed sortBy fields
    ['statusIds', 'warehouseIds', 'batchIds'],     // arrayKeys — normalized as UUID arrays
    [],                                            // booleanKeys — none client-controlled
    inventoryAllocationsQuerySchema                // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedInventoryAllocationsController
);

/**
 * @route PATCH /inventory-allocations/confirm/:orderId
 * @description Confirm a reviewed inventory allocation, locking it for fulfillment.
 * @access protected
 * @permission PERMISSION_KEYS.INVENTORY_ALLOCATION.CONFIRM
 */
router.patch(
  '/confirm/:orderId',
  authorize([PERMISSION_KEYS.INVENTORY_ALLOCATION.CONFIRM]),
  validate(orderIdParamSchema, 'params'),
  confirmInventoryAllocationController
);

module.exports = router;
