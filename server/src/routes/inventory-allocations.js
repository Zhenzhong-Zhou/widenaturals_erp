const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { orderIdParamSchema } = require('../validators/order-validators');
const {
  allocateInventorySchema,
  allocationReviewSchema, inventoryAllocationsQuerySchema
} = require('../validators/inventory-allocation-validators');
const {
  allocateInventoryForOrderController,
  reviewInventoryAllocationController,
  getPaginatedInventoryAllocationsController,
  confirmInventoryAllocationController,
} = require('../controllers/inventory-allocation-controller');
const { sanitizeFields } = require('../middlewares/sanitize');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');

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
 * GET /api/inventory-allocations
 *
 * Fetch a paginated list of inventory allocation summaries with filtering, sorting, and pagination.
 *
 * ### Middleware Stack:
 * 1. `authorize([PERMISSIONS.INVENTORY.VIEW])`
 *    → Requires `INVENTORY.VIEW` permission to access this route.
 *
 * 2. `createQueryNormalizationMiddleware('inventoryAllocationSortMap', [], [], inventoryAllocationsQuerySchema)`
 *    → Normalizes query parameters into `req.normalizedQuery`:
 *      - `page`, `limit`, `sortBy`, `sortOrder`, `filters`
 *      - Uses `inventoryAllocationSortMap` to validate sort keys (optional).
 *
 * 3. `sanitizeFields(['keyword'])`
 *    → Trims and cleans the `keyword` field to remove excess whitespace.
 *
 * 4. `validate(inventoryAllocationsQuerySchema, 'query')`
 *    → Validates query parameters against Joi schema, ensuring correct types and formats.
 *
 * 5. `getPaginatedInventoryAllocationsController`
 *    → Handles request by calling service and returning structured result.
 *
 * ### Query Parameters (validated via `inventoryAllocationsQuerySchema`):
 * - `page` (number, default: 1)
 * - `limit` (number, default: 10)
 * - `sortBy` (string, default: 'created_at')
 * - `sortOrder` (string, 'ASC' | 'DESC', default: 'DESC')
 * - `filters`:
 *   - `statusId`, `warehouseId`, `batchId`, `orderStatusId`, `orderTypeId`, `paymentStatusId`, etc.
 *   - `keyword`: Fuzzy search on order number, product name, customer name
 *   - `allocatedAfter`, `allocatedBefore`: Date range filtering
 *
 * ### Example:
 * ```http
 * GET /api/inventory-allocations?page=1&limit=20&sortBy=created_at&sortOrder=DESC&warehouseId=abc-123&keyword=NMN
 * Authorization: Bearer <token>
 * ```
 *
 * @access Protected
 * @returns {200} JSON with `data` and `pagination` fields
 */
router.get(
  '/',
  authorize([PERMISSIONS.INVENTORY.VIEW]),
  createQueryNormalizationMiddleware(
    'inventoryAllocationSortMap',
    [],
    [],
    inventoryAllocationsQuerySchema
  ),
  sanitizeFields(['keyword']),
  validate(inventoryAllocationsQuerySchema, 'query'),
  getPaginatedInventoryAllocationsController
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
