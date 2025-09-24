const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { orderIdParamSchema } = require('../validators/order-validators');
const { fulfillOutboundShipmentBodySchema, fulfillAdjustmentBodySchema, outboundFulfillmentQuerySchema } = require('../validators/outbound-fulfillment-validators');
const { fulfillOutboundShipmentController, adjustInventoryForFulfillmentController,
  getPaginatedOutboundFulfillmentController
} = require('../controllers/outbound-fulfillment-controller');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * Route: POST /orders/:orderId/fulfillment/initiate
 *
 * Initiates the fulfillment process for an outbound shipment tied to a specific order.
 *
 * Middleware:
 *  - `authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.INITIATE])`:
 *      Ensures the user has the correct permission to perform outbound fulfillment.
 *  - `validate(orderIdParamSchema, 'params')`:
 *      Validates the `orderId` path parameter (must be a valid UUID).
 *  - `validate(fulfillOutboundShipmentBodySchema, 'body')`:
 *      Validates the request body (allocation IDs, optional notes).
 *  - `fulfillOutboundShipmentController`:
 *      Executes the service layer to orchestrate fulfillment and returns a response.
 *
 * Request:
 *  - Params:
 *      - orderId: string (UUID, required)
 *  - Body:
 *      {
 *        allocations: { ids: UUID[] },
 *        fulfillmentNotes?: string,
 *        shipmentNotes?: string,
 *        shipmentBatchNote?: string
 *      }
 *
 * Response:
 *  - 200 OK: JSON object containing fulfillment result payload
 *  - 400 VALIDATION_ERROR: Invalid params/body
 *  - 403 FORBIDDEN: User lacks permission
 *  - 500 SERVICE_ERROR: Internal failure
 *
 * @access Protected
 */
router.post(
  '/orders/:orderId/fulfillment/initiate',
  authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.INITIATE]),
  validate(orderIdParamSchema, 'params'),
  validate(fulfillOutboundShipmentBodySchema, 'body'),
  fulfillOutboundShipmentController
);

/**
 * Route: POST /orders/:orderId/fulfillment/fulfill
 *
 * Purpose:
 *  Adjusts warehouse inventory and updates statuses (order, shipment, fulfillment, allocations)
 *  after an outbound fulfillment is processed.
 *
 * Validations:
 *  - `params.orderId`: must be a valid UUID (validated by `orderIdParamSchema`)
 *  - `body.orderStatus`: string (target order status code)
 *  - `body.shipmentStatus`: string (target shipment status code)
 *  - `body.fulfillmentStatus`: string (target fulfillment status code)
 *
 * Flow:
 *  - Authorize request using `PERMISSIONS.OUTBOUND_FULFILLMENT.FULFILL`.
 *  - Validate request params and body using Joi schemas.
 *  - Delegate orchestration to `adjustInventoryForFulfillmentController`.
 *  - Controller calls service to:
 *      * Apply inventory adjustments
 *      * Update related statuses
 *      * Insert activity logs
 *  - Returns standardized JSON response.
 *
 * Request:
 *  - Params:
 *      - orderId: UUID (required)
 *  - Body:
 *      {
 *        orderStatus: string,
 *        shipmentStatus: string,
 *        fulfillmentStatus: string
 *      }
 *
 * Response:
 *  - 200 OK: Fulfillment adjustment result (statuses, inventory updates, logs)
 *  - 400 VALIDATION_ERROR: Invalid request payload
 *  - 403 FORBIDDEN: User lacks required permission
 *  - 500 SERVICE_ERROR: Internal failure during adjustment
 *
 * @access Protected
 */
router.post(
  '/orders/:orderId/fulfillment/fulfill',
  authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.FULFILL]),
  validate(orderIdParamSchema, 'params'),
  validate(fulfillAdjustmentBodySchema, 'body'),
  adjustInventoryForFulfillmentController
);

/**
 * GET /api/v1/outbound-fulfillments
 *
 * Retrieves a paginated list of outbound fulfillment (shipment) records.
 *
 * ### Middleware stack:
 * - `authorize` → Ensures the user has OUTBOUND_FULFILLMENT.VIEW permission
 * - `createQueryNormalizationMiddleware` → Normalizes sort fields and array filters:
 *    - Sort map: `outboundShipmentSortMap`
 *    - Array filters: `statusIds`, `warehouseIds`, `deliveryMethodIds`
 * - `sanitizeFields` → Cleans potentially unsafe string fields (`keyword`)
 * - `validate` → Validates query params against `outboundFulfillmentQuerySchema`
 *
 * ### Query Parameters (normalized & validated):
 * - Pagination: `page`, `limit`
 * - Sorting: `sortBy`, `sortOrder` (validated against `outboundShipmentSortMap`)
 * - Filters:
 *   - Shipment-level: `statusIds[]`, `warehouseIds[]`, `deliveryMethodIds[]`
 *   - Audit: `createdBy`, `updatedBy`, `createdAfter`, `createdBefore`, `shippedAfter`, `shippedBefore`
 *   - Order-level: `orderId`, `orderNumber`
 *   - Keyword search: fuzzy match on order number, warehouse, delivery method
 *
 * ### Response (200 OK):
 * {
 *   success: true,
 *   message: "Outbound fulfillments retrieved successfully.",
 *   data: [...],
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 *
 * @access Protected
 */
router.get(
  '/',
  authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.VIEW]),
  createQueryNormalizationMiddleware(
    'outboundShipmentSortMap',
    ['statusIds', 'warehouseIds', 'deliveryMethodIds'], // array filters
    [],
    outboundFulfillmentQuerySchema
  ),
  sanitizeFields(['keyword']),
  validate(outboundFulfillmentQuerySchema, 'query'),
  getPaginatedOutboundFulfillmentController
);

module.exports = router;
