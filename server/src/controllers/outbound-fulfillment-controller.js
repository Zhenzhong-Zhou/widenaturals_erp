const wrapAsync = require('../utils/wrap-async');
const { fulfillOutboundShipmentService, adjustInventoryForFulfillmentService } = require('../services/outbound-fulfillment-service');
const { logInfo } = require('../utils/logger-helper');

/**
 * Controller: fulfillOutboundShipmentController
 *
 * Handles HTTP requests to initiate fulfillment for an outbound shipment.
 *
 * Workflow:
 *  - Expects `orderId` from URL params (`/orders/:orderId/fulfillment/initiate`).
 *  - Expects request body (validated upstream with Joi):
 *      {
 *        allocations: { ids: string[] },
 *        fulfillmentNotes?: string,
 *        shipmentNotes?: string,
 *        shipmentBatchNote?: string
 *      }
 *  - Delegates orchestration to `fulfillOutboundShipmentService`.
 *  - Returns a standardized JSON response with fulfillment data.
 *
 * Logging:
 *  - Logs success with context, order ID, and user ID.
 *  - Errors are caught by `wrapAsync` and global error handler.
 *
 * @route POST /orders/:orderId/fulfillment/initiate
 * @access Protected
 *
 * @param {import('express').Request} req - Express request (params + body validated upstream)
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} JSON response with fulfillment result
 */
const fulfillOutboundShipmentController = wrapAsync(async (req, res) => {
  const user = req.user;
  const { orderId } = req.params;
  const requestData = {
    ...req.body,
    orderId,
  };
  
  const result = await fulfillOutboundShipmentService(requestData, user);
  
  // Log success
  logInfo('Outbound shipment fulfillment initiated', req, {
    context: 'outbound-fulfillment-controller/fulfillOutboundShipmentController',
    orderId,
    userId: user.id,
  });
  
  res.status(200).json({
    success: true,
    message: `Outbound shipment created and linked to allocations for order ${orderId}.`,
    data: result,
  });
});

/**
 * Controller: adjustInventoryForFulfillmentController
 *
 * Purpose:
 *  Handles API requests to adjust inventory after a fulfillment action is completed.
 *
 * Flow:
 *  - Extracts `orderId` from route params and merges with body payload.
 *  - Calls `adjustInventoryForFulfillmentService` to process inventory, status, and logs.
 *  - Logs a structured success message for observability.
 *  - Returns a standardized JSON response:
 *      {
 *        success: true,
 *        message: 'Inventory successfully adjusted for fulfillment.',
 *        data: <result>
 *      }
 *
 * Logging:
 *  - Uses structured logging with context, orderId, and userId.
 *  - Errors are delegated to global error middleware via wrapAsync.
 *
 * @route   POST /orders/:orderId/fulfillment/fulfill
 * @access  Protected
 *
 * @param   {import('express').Request} req - Express request (params + body validated upstream)
 * @param   {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} JSON response with fulfillment adjustment result
 */
const adjustInventoryForFulfillmentController = wrapAsync( async (req, res) => {
  const user = req.user;
  const { orderId } = req.params;
  const requestData = {
    ...req.body,
    orderId,
  };
  
  const result = await adjustInventoryForFulfillmentService(requestData, user);
  
  logInfo('Fulfillment inventory adjustment completed successfully', req, {
    context: 'outbound-fulfillment-controller/adjustInventoryForFulfillmentController',
    orderId: result.orderId,
    userId: user?.id,
  });
  
  res.status(200).json({
    success: true,
    message: 'Inventory successfully adjusted for fulfillment.',
    data: result,
  });
});

module.exports = {
  fulfillOutboundShipmentController,
  adjustInventoryForFulfillmentController,
};
