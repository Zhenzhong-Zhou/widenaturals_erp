const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const validate = require('../middlewares/validate');
const { orderIdParamSchema } = require('../validators/order-validators');
const { shipmentIdParamSchema } = require('../validators/outbound-shipment-validators');
const {
  fulfillOutboundShipmentBodySchema,
  fulfillAdjustmentBodySchema,
  outboundFulfillmentQuerySchema, manualFulfillmentBodySchema
} = require('../validators/outbound-fulfillment-validators');
const {
  fulfillOutboundShipmentController,
  confirmOutboundFulfillmentController,
  getPaginatedOutboundFulfillmentController,
  getShipmentDetailsController, completeManualFulfillmentController
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
 * Route: POST /orders/:orderId/fulfillment/confirm
 *
 * Purpose:
 *  Confirms outbound fulfillment for a given order.
 *  This endpoint finalizes the fulfillment process by:
 *    - Validating order, shipment, and fulfillment statuses.
 *    - Applying inventory quantity updates.
 *    - Updating related statuses across order, allocations, fulfillments, and shipments.
 *    - Recording inventory activity logs for traceability.
 *
 * Validations:
 *  - `params.orderId`: must be a valid UUID (validated by `orderIdParamSchema`)
 *  - `body.orderStatus`: string (target order status code, e.g. "ORDER_FULFILLED")
 *  - `body.shipmentStatus`: string (target shipment status code, e.g. "SHIPMENT_DISPATCHED")
 *  - `body.fulfillmentStatus`: string (target fulfillment status code, e.g. "FULFILLMENT_CONFIRMED")
 *
 * Flow:
 *  - Authorize request using `PERMISSIONS.OUTBOUND_FULFILLMENT.CONFIRM`.
 *  - Validate request params and body using Joi schemas.
 *  - Delegate orchestration to `confirmOutboundFulfillmentController`.
 *  - Controller calls service to:
 *      • Validate workflow eligibility (statuses, shipment linkage)
 *      • Apply inventory updates
 *      • Update all related statuses
 *      • Insert audit and activity logs
 *  - Returns a standardized JSON response with updated status and inventory data.
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
 *  - 200 OK: Outbound fulfillment confirmed successfully
 *  - 400 VALIDATION_ERROR: Invalid payload or status transition
 *  - 403 FORBIDDEN: User lacks required permission
 *  - 404 NOT_FOUND: Order or fulfillment not found
 *  - 500 SERVICE_ERROR: Internal failure during confirmation
 *
 * @access Protected
 */
router.post(
  '/orders/:orderId/fulfillment/confirm',
  authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.CONFIRM]),
  validate(orderIdParamSchema, 'params'),
  validate(fulfillAdjustmentBodySchema, 'body'),
  confirmOutboundFulfillmentController
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

/**
 * GET /api/v1/outbound-fulfillments/:shipmentId/details
 *
 * Retrieves full details for a single outbound shipment, including:
 *  - Shipment header (status, warehouse, delivery info, notes)
 *  - Tracking information (carrier, tracking number, service, status)
 *  - Fulfillments (linked order items, quantities, fulfillment status)
 *  - SKU/Product metadata (if product item)
 *  - Packaging material metadata (if packaging material item)
 *  - Batch allocations (product or packaging material batches tied to each fulfillment)
 *
 * ### Middleware stack:
 * - `authorize` → Ensures the user has OUTBOUND_FULFILLMENT.VIEW permission
 * - `validate` → Validates `shipmentId` route param against `uuidSchema`
 *
 * ### Route Parameters:
 * - `shipmentId` (string, UUID, required) → The outbound shipment to fetch
 *
 * ### Response (200 OK):
 * {
 *   success: true,
 *   message: "Shipment details fetched successfully",
 *   data: {
 *     shipment: { ...header, tracking: {...} },
 *     fulfillments: [
 *       {
 *         fulfillmentId,
 *         status,
 *         orderItem: { sku | packagingMaterial },
 *         batches: [...]
 *       }
 *     ]
 *   }
 * }
 *
 * ### Error Responses:
 * - 400 Bad Request → Invalid or missing shipmentId
 * - 403 Forbidden → User lacks OUTBOUND_FULFILLMENT.VIEW permission
 * - 404 Not Found → Shipment with given ID does not exist
 *
 * @access Protected
 */
router.get(
  '/:shipmentId/details',
  authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.VIEW]),
  validate(shipmentIdParamSchema, 'params'), // validate shipmentId as UUID
  getShipmentDetailsController
);

/**
 * Route: POST /outbound-fulfillment/manual/:shipmentId/complete
 *
 * Purpose:
 *  Finalizes a manual outbound fulfillment workflow, such as:
 *    - Customer in-store pickup, or
 *    - Personal (non-carrier) delivery.
 *
 *  This endpoint completes the workflow by:
 *    - Validating order, fulfillment, shipment, and allocation statuses.
 *    - Updating all related entities (order, order items, fulfillments, shipments)
 *      to reflect completion.
 *    - Ensuring transactional integrity and logging audit data for traceability.
 *
 * Validations:
 *  - `params.shipmentId`: must be a valid UUID (validated by `shipmentIdParamSchema`)
 *  - `body.orderStatus`: target order status code (e.g. "ORDER_DELIVERED")
 *  - `body.shipmentStatus`: target shipment status code (e.g. "SHIPMENT_COMPLETED")
 *  - `body.fulfillmentStatus`: target fulfillment status code (e.g. "FULFILLMENT_COMPLETED")
 *
 * Flow:
 *  - Authorize request using `PERMISSIONS.OUTBOUND_FULFILLMENT.COMPLETE_MANUAL`.
 *  - Validate route params and body payload with Joi schemas.
 *  - Delegate execution to `completeManualFulfillmentController`, which:
 *      • Validates pre-completion statuses.
 *      • Performs atomic status updates across related entities.
 *      • Logs audit and system activity.
 *  - Returns a standardized JSON response with updated entity statuses.
 *
 * Request:
 *  - Params:
 *      - shipmentId: UUID (required)
 *  - Body:
 *      {
 *        orderStatus: string,
 *        shipmentStatus: string,
 *        fulfillmentStatus: string
 *      }
 *
 * Response:
 *  - 200 OK: Manual fulfillment completed successfully.
 *  - 400 VALIDATION_ERROR: Invalid payload or status transition.
 *  - 403 FORBIDDEN: User lacks required permission.
 *  - 404 NOT_FOUND: Shipment or related entities not found.
 *  - 500 SERVICE_ERROR: Internal error during completion.
 *
 * @access Protected
 */
router.post(
  '/manual/:shipmentId/complete',
  authorize([PERMISSIONS.OUTBOUND_FULFILLMENT.COMPLETE_MANUAL]),
  validate(shipmentIdParamSchema, 'params'),
  validate(manualFulfillmentBodySchema, 'body'),
  completeManualFulfillmentController
);

module.exports = router;
