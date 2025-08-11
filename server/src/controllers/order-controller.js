const {
  createOrderService,
  fetchOrderDetails,
  fetchAllOrdersService,
  confirmOrderService,
  fetchAllocationEligibleOrdersService,
  fetchAllocationEligibleOrderDetails,
} = require('../services/order-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { logSystemInfo, logSystemWarn } = require('../utils/system-logger');
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
    logSystemWarn('Missing category in request params', {
      context: 'order-controller/createOrderController',
      userId,
    });
    return next(AppError.validationError('Order category is required.'));
  }
  
  // Normalize category
  const cleanCategory = String(category).trim().toLowerCase();

  if (!orderData || typeof orderData !== 'object') {
    logSystemWarn('Missing or invalid order data payload', {
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

  logSystemInfo('Starting order creation', {
    context: 'order-controller/createOrderController',
    userId,
    category: cleanCategory,
  });
  
  // Business entrypoint — transaction + domain rules live beneath
  const result = await createOrderService(payload, cleanCategory, req.user);

  logSystemInfo('Order created successfully', {
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
 * Controller to fetch order details by ID.
 */
const getOrderDetailsController = wrapAsync(async (req, res, next) => {
  const { id: orderId } = req.params;
  const user = req.user;

  if (!orderId) {
    throw AppError.validationError('Order ID is required.');
  }

  const orderDetails = await fetchOrderDetails(orderId, user);

  if (!orderDetails) {
    throw AppError.notFoundError(`Order with ID ${orderId} not found.`);
  }

  res.status(200).json({
    success: true,
    message: 'Order details retrieved successfully.',
    data: orderDetails,
  });
});

/**
 * Generic controller for fetching orders using a specified service function.
 *
 * @param {Function} serviceFn - The service function to fetch orders.
 * @returns {Function} - Express route handler.
 */
const createOrderFetchController = (serviceFn) =>
  wrapAsync(async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        verifyOrderNumbers = true,
      } = req.query;

      const verifyOrderNumbersBool = verifyOrderNumbers !== 'false';

      const result = await serviceFn({
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder,
        verifyOrderNumbers: verifyOrderNumbersBool,
      });

      res.status(200).json({
        success: true,
        message: 'Orders fetched successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logError('Error in order fetch controller:', error);
      next(error);
    }
  });

/**
 * Controller to handle fetching all orders.
 * Supports pagination, sorting, and optional order number validation.
 *
 * @type {Function}
 */
const getAllOrdersController = createOrderFetchController(
  fetchAllOrdersService
);

/**
 * Controller to handle fetching orders eligible for inventory allocation.
 * Supports pagination, sorting, and optional order number filtering.
 *
 * @type {Function}
 */
const getAllocationEligibleOrdersController = createOrderFetchController(
  fetchAllocationEligibleOrdersService
);

/**
 * Controller to confirm an order and its items.
 * @route POST /orders/:orderId/confirm
 */
const confirmOrderController = wrapAsync(async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!orderId) {
      throw AppError.validationError('Missing required parameter: orderId');
    }

    const result = await confirmOrderService(orderId, user);

    res.status(200).json({
      success: true,
      message: 'Order successfully confirmed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Controller to fetch an allocation-eligible order for inventory allocation.
 * Ensures the order exists, is in a valid status, and the user has proper permissions.
 *
 * @route GET /api/orders/:orderId/allocation
 * @access Protected
 */
const getAllocationEligibleOrderDetailsController = wrapAsync(
  async (req, res) => {
    const { orderId } = req.params;
    const user = req.user;

    const order = await fetchAllocationEligibleOrderDetails(orderId, user);

    res.status(200).json({
      success: true,
      message: 'Confirmed order allocation data fetched successfully',
      data: order,
    });
  }
);

module.exports = {
  createOrderController,
};
