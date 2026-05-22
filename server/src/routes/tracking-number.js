/**
 * Routes for the `tracking_numbers` domain.
 *
 * Mounted under /tracking-numbers by the parent router. Authentication is
 * applied at the app level — these handlers assume req.auth.user is already
 * populated and only enforce permission + payload validation here.
 *
 * Middleware order is fixed:
 *   authorize → params validation → body validation → controller
 * Cheaper checks first (permission, URL shape), heavier last (body schema).
 */

const express = require('express');
const {
  shipmentIdParamSchema,
} = require('../validators/outbound-shipment-validators');
const {
  attachTrackingNumbersBodySchema,
} = require('../validators/tracking-number-validators');
const {
  attachTrackingNumbersController,
} = require('../controllers/tracking-number-controller');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');

const router = express.Router();

/**
 * @route POST /tracking-numbers/shipments/:shipmentId/attach
 * @description Attach one or more tracking numbers to an outbound shipment.
 *              Supports multi-package shipments via the `records` array (1-50 items).
 *              Validates URL param shape and body payload before the controller runs.
 * @access protected
 * @permission PERMISSION_KEYS.TRACKING_NUMBERS.ATTACH
 */
router.post(
  '/shipments/:shipmentId/attach',
  authorize([PERMISSION_KEYS.TRACKING_NUMBERS.ATTACH]),
  validate(shipmentIdParamSchema, 'params'),
  validate(attachTrackingNumbersBodySchema, 'body'),
  attachTrackingNumbersController
);

module.exports = router;
