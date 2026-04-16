/**
 * @file outbound-fulfillments.js
 * @description Outbound fulfillment initiation, confirmation, manual completion,
 * shipment detail, and paginated query routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const { orderIdParamSchema } = require('../validators/order-validators');
const {
  shipmentIdParamSchema,
} = require('../validators/outbound-shipment-validators');
const {
  fulfillOutboundShipmentBodySchema,
  fulfillAdjustmentBodySchema,
  outboundFulfillmentQuerySchema,
  manualFulfillmentBodySchema,
} = require('../validators/outbound-fulfillment-validators');
const {
  fulfillOutboundShipmentController,
  confirmOutboundFulfillmentController,
  getPaginatedOutboundFulfillmentController,
  getShipmentDetailsController,
  completeManualFulfillmentController,
} = require('../controllers/outbound-fulfillment-controller');

const router = express.Router();

/**
 * @route POST /outbound-fulfillments/orders/:orderId/fulfillment/initiate
 * @description Initiate outbound fulfillment for a specific order. Validates the
 * order ID and fulfillment payload before delegating to the controller.
 * @access protected
 * @permission PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.INITIATE
 */
router.post(
  '/orders/:orderId/fulfillment/initiate',
  authorize([PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.INITIATE]),
  validate(orderIdParamSchema, 'params'),
  validate(fulfillOutboundShipmentBodySchema, 'body'),
  fulfillOutboundShipmentController
);

/**
 * @route POST /outbound-fulfillments/orders/:orderId/fulfillment/confirm
 * @description Confirm a pending outbound fulfillment, applying any quantity
 * adjustments from the review payload.
 * @access protected
 * @permission PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.CONFIRM
 */
router.post(
  '/orders/:orderId/fulfillment/confirm',
  authorize([PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.CONFIRM]),
  validate(orderIdParamSchema, 'params'),
  validate(fulfillAdjustmentBodySchema, 'body'),
  confirmOutboundFulfillmentController
);

/**
 * @route GET /outbound-fulfillments
 * @description Paginated outbound fulfillment records with optional filters and sorting.
 * Filters: statusIds, warehouseIds, deliveryMethodIds.
 * Sorting: sortBy, sortOrder (uses outboundShipmentSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.VIEW]),
  validate(outboundFulfillmentQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'outboundShipmentSortMap', // moduleKey — drives allowed sortBy fields
    ['statusIds', 'warehouseIds', 'deliveryMethodIds'], // arrayKeys — normalized as UUID arrays
    [], // booleanKeys — none client-controlled
    outboundFulfillmentQuerySchema // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedOutboundFulfillmentController
);

/**
 * @route GET /outbound-fulfillments/:shipmentId/details
 * @description Full detail record for a single outbound shipment by ID.
 * @access protected
 * @permission PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.VIEW
 */
router.get(
  '/:shipmentId/details',
  authorize([PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.VIEW]),
  validate(shipmentIdParamSchema, 'params'),
  getShipmentDetailsController
);

/**
 * @route POST /outbound-fulfillments/manual/:shipmentId/complete
 * @description Mark a manual outbound shipment as complete. Validates the shipment
 * ID and manual fulfillment payload before delegating to the controller.
 * @access protected
 * @permission PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.COMPLETE_MANUAL
 */
router.post(
  '/manual/:shipmentId/complete',
  authorize([PERMISSION_KEYS.OUTBOUND_FULFILLMENTS.COMPLETE_MANUAL]),
  validate(shipmentIdParamSchema, 'params'),
  validate(manualFulfillmentBodySchema, 'body'),
  completeManualFulfillmentController
);

module.exports = router;
