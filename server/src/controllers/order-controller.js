const {
  createOrderService,
  fetchOrderDetailsByIdService,
  updateOrderStatusService, fetchPaginatedOrdersService,
} = require('../services/order-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { logInfo, logWarn } = require('../utils/logger-helper');
const { cleanObject } = require('../utils/object-utils');

/**
 * Controller to handle creating a new order.
 *
 * Responsibilities:
 * - Requires `category` path param; normalizes to lowercase.
 * - Requires a valid JSON body; shallow-cleans null/undefined fields.
 * - Injects `created_by` from the authenticated user.
 * - Delegates order creation to the service layer.
 * - Returns 201 with the created order data.
 *
 * Notes:
 * - Request body is shallow-cleaned (top-level only). Nested fields (e.g., order_items[*]) are not deep-cleaned here.
 * - Validation of detailed schema (e.g., orderTypeId, item shapes) is expected to be handled by schema middleware or the service layer.
 *
 * Logs:
 * - Warns on validation failures.
 * - Logs info on start and success.
 *
 * @param {import('express').Request} req - Expects:
 *   - params.category {string}
 *   - body {object}
 *   - user {object} (for created_by)
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createOrderController = wrapAsync(async (req, res, next) => {
  const { category } = req.params;
  const orderData = req.body;
  const user = req.user;
  const userId = user?.id;

  if (!category) {
    logWarn('Missing category in request params', req, {
      context: 'order-controller/createOrderController',
      userId,
    });
    return next(AppError.validationError('Order category is required.'));
  }
  
  // Normalize category
  const cleanCategory = String(category).trim().toLowerCase();

  if (!orderData || typeof orderData !== 'object') {
    logWarn('Missing or invalid order data payload', req, {
      context: 'order-controller/createOrderController',
      userId,
      category: cleanCategory,
    });
    return next(AppError.validationError('Order data payload is required.'));
  }

  // Shallow-clean null/undefined fields (top-level only)
  const cleanedBody = cleanObject(req.body);
  
  // Edge-responsibility: add auditing info, not done in business layer
  const payload = { ...cleanedBody, created_by: userId };

  logInfo('Starting order creation', req, {
    context: 'order-controller/createOrderController',
    userId,
    category: cleanCategory,
  });
  
  // Business entrypoint — transaction + domain rules live beneath
  const result = await createOrderService(payload, cleanCategory, req.user);
  
  logInfo('Order created successfully', req, {
    context: 'order-controller/createOrderController',
    userId,
    category: cleanCategory,
    orderId: result.orderId,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

/**
 * Controller: Fetch paginated list of orders with filters and access control.
 *
 * Route: GET /orders/:category
 *
 * Behavior:
 * - Verifies the user has permission to view orders in the given category.
 * - Evaluates access control (e.g. `canViewAllOrders` vs. scoped visibility).
 * - Delegates to `fetchPaginatedOrdersService` to apply filters and transform results.
 *
 * Expected Inputs:
 * - `req.params.category` (string): The order category (e.g., 'SALES', 'TRANSFER').
 * - `req.query` (object): Optional filters and pagination parameters.
 * - `req.normalizedQuery` (object): Normalized and parsed version of query params,
 *     including `filters`, `page`, `limit`, `sortBy`, `sortOrder`.
 * - `req.user` (object): Authenticated user with permissions context.
 *
 * Supported Query Parameters:
 * - Pagination: `page`, `limit`
 * - Sorting: `sortBy`, `sortOrder`
 * - Filters:
 *    - `keyword`
 *    - `orderNumber`
 *    - `orderTypeId`, `orderStatusId`
 *    - `createdAfter`, `createdBefore`
 *    - `statusDateAfter`, `statusDateBefore`
 *
 * Success Response:
 * - Status: `200 OK`
 * - Payload:
 *   {
 *     success: true,
 *     message: 'Orders retrieved successfully',
 *     data: [ ...filteredOrders ],
 *     pagination: { page, limit, totalCount, totalPages }
 *   }
 *
 * Error Handling:
 * - All errors (validation, permission, business) are forwarded to global middleware.
 *
 * @async
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 */
const fetchPaginatedOrdersController = wrapAsync(async (req, res) => {
  const category = req.params.category;
  const user = req.user;
  
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  logInfo('Received request to fetch paginated orders', {
    context: 'order-controller/fetchPaginatedOrdersController',
    category,
    userId: user?.id,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  const { data, pagination } = await fetchPaginatedOrdersService({
    filters,
    category,
    user,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data,
    pagination,
  });
});

/**
 * Controller: getOrderDetailsByIdController
 * Route: GET /orders/:category/:orderId
 *
 * Retrieves full order details (header + line items) for a given order category and ID.
 *
 * Permissions:
 *   - Requires `ORDER.VIEW` (or category-specific variant) permission — enforced by upstream middleware.
 *
 * Validations:
 *   - `params.category`:
 *       • Required string (validated against allowed ORDER_CATEGORIES in schema).
 *       • Trimmed and normalized to lowercase.
 *   - `params.orderId`:
 *       • Required string.
 *       • Must be a valid UUID v4.
 *       • Trimmed by middleware.
 *
 * Behavior:
 *   - Normalizes `category` to lowercase for consistent downstream use.
 *   - Delegates retrieval to `fetchOrderDetailsByIdService`, which:
 *       • Applies business rules and category-based access control.
 *       • Filters or restricts data based on the requesting user's permissions.
 *   - Logs the retrieval action with contextual metadata for auditing.
 *   - Responds with a standardized JSON envelope containing:
 *       {
 *         success: true,
 *         message: string,
 *         data: TransformedOrder
 *       }
 *   - Forwards all thrown errors to the global error handler via `wrapAsync`.
 *
 * Success Response (200):
 *   - JSON payload with `success=true`, a message, and `data` containing the order details.
 *
 * Error Responses:
 *   - 400 Bad Request: Invalid `category` or `orderId` format (caught by validation middleware).
 *   - 403 Forbidden: User lacks required permission to view the order.
 *   - 404 Not Found: No order exists for the given category/ID combination.
 *   - 500 Internal Server Error: Unexpected errors (handled globally).
 *
 * @async
 * @param {import('express').Request} req - Express request object (expects `params.category`, `params.orderId`, and `user`).
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Sends JSON response to the client.
 */
const getOrderDetailsByIdController = wrapAsync(async (req, res) => {
  const { category, orderId } = req.params;
  const user = req.user;
  
  // Normalize category
  const cleanCategory = category.toLowerCase();
  
  const orderDetails = await fetchOrderDetailsByIdService(cleanCategory, orderId, user);
  
  logInfo('Order details retrieved', req, {
    context: 'order-controller/getOrderDetailsByIdController',
    orderId,
    userId: user?.id,
    severity: 'INFO',
  });

  res.status(200).json({
    success: true,
    message: 'Order details retrieved successfully.',
    data: orderDetails,
  });
});

/**
 * Controller: Update Order Status
 *
 * Handles order status transitions for a given order category and ID.
 *
 * Route:
 *   PATCH /api/:category/orders/:orderId/status
 *
 * Expected Request:
 *   - Params:
 *       - category: string (e.g., 'sales', 'transfer')
 *       - orderId: UUID string
 *   - Body:
 *       - statusCode: string (e.g., 'ORDER_CONFIRMED', must be in ORDER_STATUS_CODES)
 *   - Auth:
 *       - User must be authenticated (injected by auth middleware)
 *
 * Response: 200 OK
 *   {
 *     success: true,
 *     message: "Order status updated successfully",
 *     data: {
 *       order: { ...enrichedOrder },  // with camelCase fields
 *       items: [ ...enrichedItems ]   // with camelCase fields
 *     },
 *     meta: {
 *       orderUpdated: true,
 *       itemsUpdated: <number>,       // number of affected order items
 *       recordsUpdated: <number>      // total records modified (order + items)
 *     }
 *   }
 *
 * Notes:
 *   - Business rules for valid status transitions are handled in the service layer.
 *   - Logging includes contextual metadata for traceability.
 */
const updateOrderStatusController = wrapAsync(async (req, res) => {
  const user = req.user; // must be injected by auth middleware
  const categoryParam = String(req.params.category || '').trim().toLowerCase();
  const orderId = String(req.params.orderId || '').trim();
  const nextStatusCode = String(req.body?.statusCode || '').trim();

  const { enrichedOrder, enrichedItems } = await updateOrderStatusService(
    user,
    categoryParam,
    orderId,
    nextStatusCode
  );

  logInfo('Order status updated (controller)', req, {
    context: 'order-controller/updateOrderStatus',
    orderId: enrichedOrder.id,
    newStatus: enrichedOrder.statusCode,
    category: categoryParam,
    itemsUpdated: enrichedItems.length,
    userId: user?.id,
    role: user?.roleName || user?.role,
  });

  return res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order: enrichedOrder,
      items: enrichedItems,
    },
    meta: {
      orderUpdated: true,
      itemsUpdated: enrichedItems.length,
      recordsUpdated: 1 + enrichedItems.length,
    }
  });
});

module.exports = {
  createOrderController,
  fetchPaginatedOrdersController,
  getOrderDetailsByIdController,
  updateOrderStatusController,
};
