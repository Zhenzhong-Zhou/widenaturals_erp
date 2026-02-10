const wrapAsync = require('../utils/wrap-async');
const {
  fulfillOutboundShipmentService,
  confirmOutboundFulfillmentService,
  fetchPaginatedOutboundFulfillmentService,
  fetchShipmentDetailsService,
  completeManualFulfillmentService,
} = require('../services/outbound-fulfillment-service');
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
  const user = req.auth.user;
  const { orderId } = req.params;
  const requestData = {
    ...req.body,
    orderId,
  };

  const result = await fulfillOutboundShipmentService(requestData, user);

  // Log success
  logInfo('Outbound shipment fulfillment initiated', req, {
    context:
      'outbound-fulfillment-controller/fulfillOutboundShipmentController',
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
 * Controller: confirmOutboundFulfillmentController
 *
 * Purpose:
 *  Handles API requests to confirm outbound fulfillment.
 *  This endpoint finalizes the fulfillment process — applying inventory updates,
 *  resolving status transitions, and recording inventory activity logs.
 *
 * Flow:
 *  - Extracts `orderId` from route params and merges with body payload.
 *  - Invokes `confirmOutboundFulfillmentService` to perform transactional logic:
 *      • Validate workflow statuses (order, shipment, fulfillment)
 *      • Apply inventory deductions
 *      • Update related statuses across entities
 *      • Insert audit and activity logs
 *  - Logs a structured success message for observability.
 *  - Returns a standardized JSON response:
 *      {
 *        success: true,
 *        message: 'Outbound fulfillment successfully confirmed.',
 *        data: <confirmationResult>
 *      }
 *
 * Logging:
 *  - Uses structured logging with context, orderId, and userId.
 *  - All thrown errors are handled by the global error middleware (via wrapAsync).
 *
 * @route   POST /orders/:orderId/fulfillment/confirm
 * @access  Protected
 *
 * @param   {import('express').Request} req - Express request (validated upstream)
 * @param   {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} JSON response with fulfillment confirmation result
 */
const confirmOutboundFulfillmentController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { orderId } = req.params;

  // Merge path param and request body
  const requestData = { ...req.body, orderId };

  // Execute confirmation logic
  const result = await confirmOutboundFulfillmentService(requestData, user);

  // Structured success log
  logInfo('Outbound fulfillment confirmed successfully', req, {
    context:
      'outbound-fulfillment-controller/confirmOutboundFulfillmentController',
    orderId: result.orderId,
    userId: user?.id,
  });

  // Respond to client
  res.status(200).json({
    success: true,
    message: 'Outbound fulfillment successfully confirmed.',
    data: result,
  });
});

/**
 * Controller: Get Paginated Outbound Fulfillments
 *
 * Handles GET /api/v1/outbound-fulfillments requests.
 *
 * Flow:
 * 1. Extracts normalized query params (`page`, `limit`, `sortBy`, `sortOrder`, `filters`)
 *    from `req.normalizedQuery` (populated by query normalization middleware).
 * 2. Delegates to `fetchPaginatedOutboundFulfillmentService` to fetch
 *    transformed shipment records with pagination and filtering applied.
 * 3. Responds with a standardized JSON payload including:
 *    - `success: true`
 *    - `message: "Outbound fulfillments retrieved successfully."`
 *    - `data: []` array of outbound fulfillment records
 *    - `pagination` metadata `{ page, limit, totalRecords, totalPages }`
 *
 * Example response:
 * {
 *   success: true,
 *   message: "Outbound fulfillments retrieved successfully.",
 *   data: [
 *     {
 *       shipmentId: "uuid",
 *       order: { id: "uuid", number: "SO-00123" },
 *       warehouse: { id: "uuid", name: "Main Warehouse" },
 *       status: { id: "uuid", code: "SHIPPED", name: "Shipped" },
 *       dates: { shippedAt: "...", createdAt: "...", updatedAt: "..." },
 *       createdBy: { id: "uuid", fullName: "Alice Admin" },
 *       updatedBy: { id: "uuid", fullName: "Bob Manager" }
 *     }
 *   ],
 *   pagination: { page: 1, limit: 10, totalRecords: 42, totalPages: 5 }
 * }
 *
 * @access Protected
 * @throws {AppError} Propagates errors from the service layer
 */
const getPaginatedOutboundFulfillmentController = wrapAsync(
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;

    // Step 1: Fetch transformed paginated results from service
    const { data, pagination } = await fetchPaginatedOutboundFulfillmentService(
      {
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      }
    );

    // Step 2: Return 200 response
    res.status(200).json({
      success: true,
      message: 'Outbound fulfillments retrieved successfully.',
      data,
      pagination,
    });
  }
);

/**
 * Controller: Fetch detailed outbound shipment information by ID.
 *
 * Route: GET /api/v1/outbound-shipments/:shipmentId/details
 *
 * Responsibilities:
 *  - Validates request params
 *  - Calls service to fetch + transform shipment details
 *  - Returns standardized JSON response
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
const getShipmentDetailsController = wrapAsync(async (req, res) => {
  const { shipmentId } = req.params;

  const details = await fetchShipmentDetailsService(shipmentId);

  logInfo('Shipment details fetched successfully', req, {
    context: 'outbound-fulfillment-controller/getShipmentDetailsController',
    shipmentId,
  });

  return res.status(200).json({
    success: true,
    message: 'Shipment details fetched successfully',
    data: details,
  });
});

/**
 * Controller: completeManualFulfillmentController
 *
 * Purpose:
 *  Handles API requests to finalize manual fulfillment processes
 *  (e.g., in-store pickup or personal delivery).
 *  This endpoint completes the workflow by updating all related entity statuses —
 *  including order, order items, shipments, and fulfillments — in a single transaction.
 *
 * Flow:
 *  - Extracts `shipmentId` from route params and merges it with the request body.
 *  - Invokes `completeManualFulfillmentService` to execute transactional logic:
 *      • Validate pre-completion statuses (order, shipment, fulfillment, allocations)
 *      • Update all related statuses to reflect manual fulfillment completion
 *      • Ensure transactional consistency and log audit details
 *  - Logs a structured success event for observability.
 *  - Returns a standardized JSON response:
 *      {
 *        success: true,
 *        message: 'Manual fulfillment completed successfully.',
 *        data: <manualFulfillmentResult>
 *      }
 *
 * Logging:
 *  - Uses structured logging with context, shipmentId, and userId.
 *  - All thrown errors are handled by global error middleware (via wrapAsync).
 *
 * @route   POST /outbound-fulfillment/manual/:shipmentId/complete
 * @access  Protected
 *
 * @param   {import('express').Request} req - Express request (validated upstream)
 * @param   {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} JSON response with manual fulfillment result
 */
const completeManualFulfillmentController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { shipmentId } = req.params;

  // Merge route param and request body into a single payload
  const requestData = { ...req.body, shipmentId };

  // --- Execute manual fulfillment workflow
  const result = await completeManualFulfillmentService(requestData, user);

  // --- Structured success log
  logInfo('Manual fulfillment completed successfully', req, {
    context:
      'outbound-fulfillment-controller/completeManualFulfillmentController',
    shipmentId,
    userId: user?.id,
  });

  // --- Send standardized JSON response
  return res.status(200).json({
    success: true,
    message: 'Manual fulfillment completed successfully.',
    data: result,
  });
});

module.exports = {
  fulfillOutboundShipmentController,
  confirmOutboundFulfillmentController,
  getPaginatedOutboundFulfillmentController,
  getShipmentDetailsController,
  completeManualFulfillmentController,
};
