/**
 * @file outbound-fulfillment-controller.js
 * @module controllers/outbound-fulfillment-controller
 *
 * @description
 * Controllers for the Outbound Fulfillment resource.
 *
 * Routes:
 *   POST  /api/v1/orders/:orderId/outbound-fulfillment          → fulfillOutboundShipmentController
 *   PATCH /api/v1/orders/:orderId/outbound-fulfillment/confirm  → confirmOutboundFulfillmentController
 *   GET   /api/v1/outbound-fulfillments                         → getPaginatedOutboundFulfillmentController
 *   GET   /api/v1/shipments/:shipmentId                         → getShipmentDetailsController
 *   PATCH /api/v1/shipments/:shipmentId/complete                → completeManualFulfillmentController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *   orderId and shipmentId are present in the URL — no controller-level logging needed.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fulfillOutboundShipmentService,
  confirmOutboundFulfillmentService,
  fetchPaginatedOutboundFulfillmentService,
  fetchShipmentDetailsService,
  completeManualFulfillmentService,
} = require('../services/outbound-fulfillment-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/orders/:orderId/outbound-fulfillment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initiates outbound shipment fulfillment for an order.
 *
 * Requires: auth middleware, Joi body validation, FULFILL_OUTBOUND_SHIPMENT permission.
 */
const fulfillOutboundShipmentController = wrapAsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const user = req.auth.user;

  const result = await fulfillOutboundShipmentService(req.body, orderId, user);

  res.status(200).json({
    success: true,
    message: `Outbound shipment created and linked to allocations for order ${orderId}.`,
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/:orderId/outbound-fulfillment/confirm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirms a pending outbound fulfillment for an order.
 *
 * Requires: auth middleware, Joi body validation, CONFIRM_OUTBOUND_FULFILLMENT permission.
 */
const confirmOutboundFulfillmentController = wrapAsyncHandler(
  async (req, res) => {
    const { orderId } = req.params;
    const user = req.auth.user;

    const result = await confirmOutboundFulfillmentService(
      req.body,
      orderId,
      user
    );

    res.status(200).json({
      success: true,
      message: 'Outbound fulfillment confirmed successfully.',
      data: result,
      traceId: req.traceId,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/outbound-fulfillments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated outbound fulfillment records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_OUTBOUND_FULFILLMENTS permission.
 */
const getPaginatedOutboundFulfillmentController = wrapAsyncHandler(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    const { data, pagination } = await fetchPaginatedOutboundFulfillmentService(
      {
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Outbound fulfillments retrieved successfully.',
      data,
      pagination,
      traceId: req.traceId,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/shipments/:shipmentId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves details for a specific shipment.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_SHIPMENTS permission.
 */
const getShipmentDetailsController = wrapAsyncHandler(async (req, res) => {
  const { shipmentId } = req.params;

  const data = await fetchShipmentDetailsService(shipmentId);

  res.status(200).json({
    success: true,
    message: 'Shipment details retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/shipments/:shipmentId/complete
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Completes the manual fulfillment workflow for a shipment.
 *
 * Requires: auth middleware, Joi body validation, COMPLETE_MANUAL_FULFILLMENT permission.
 */
const completeManualFulfillmentController = wrapAsyncHandler(
  async (req, res) => {
    const { shipmentId } = req.params;
    const user = req.auth.user;

    const result = await completeManualFulfillmentService(
      req.body,
      shipmentId,
      user
    );

    res.status(200).json({
      success: true,
      message: 'Manual fulfillment completed successfully.',
      data: result,
      traceId: req.traceId,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  fulfillOutboundShipmentController,
  confirmOutboundFulfillmentController,
  getPaginatedOutboundFulfillmentController,
  getShipmentDetailsController,
  completeManualFulfillmentController,
};
