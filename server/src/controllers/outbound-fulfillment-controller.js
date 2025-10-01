const wrapAsync = require('../utils/wrap-async');
const { fulfillOutboundShipmentService, adjustInventoryForFulfillmentService, fetchPaginatedOutboundFulfillmentService,
  fetchShipmentDetailsService
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
const getPaginatedOutboundFulfillmentController = wrapAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  // Step 1: Fetch transformed paginated results from service
  const { data, pagination } = await fetchPaginatedOutboundFulfillmentService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  // Step 2: Return 200 response
  res.status(200).json({
    success: true,
    message: 'Outbound fulfillments retrieved successfully.',
    data,
    pagination,
  });
});

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

module.exports = {
  fulfillOutboundShipmentController,
  adjustInventoryForFulfillmentController,
  getPaginatedOutboundFulfillmentController,
  getShipmentDetailsController,
};
