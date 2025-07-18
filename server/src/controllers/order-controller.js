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

/**
 * Controller to handle creating a new order.
 *
 * This controller:
 * - Validates that `category` is provided in the route params.
 * - Validates that `orderTypeCode` is provided in the request body.
 * - Validates that the request body contains order data.
 * - Automatically injects creator info (`created_by`).
 * - Delegates creation logic to the service layer.
 * - Returns a 201 response with the created order details.
 *
 * Logs warnings for validation failures and info on success.
 *
 * @param {import('express').Request} req - Express request object. Expects:
 *   - `params.category`: string (required)
 *   - `body.orderTypeCode`: string (required)
 *   - `body`: object containing order payload
 *   - `user`: authenticated user object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 *
 * @returns {Promise<void>} - Sends a JSON response or passes error to next()
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

  const cleanCategory = category.trim().toLowerCase();

  if (!orderData || typeof orderData !== 'object') {
    logSystemWarn('Missing or invalid order data payload', {
      context: 'order-controller/createOrderController',
      userId,
      category: cleanCategory,
    });
    return next(AppError.validationError('Order data payload is required.'));
  }

  // Inject creator info
  orderData.created_by = userId;

  logSystemInfo('Starting order creation', {
    context: 'order-controller/createOrderController',
    userId,
    category: cleanCategory,
  });

  const result = await createOrderService(orderData, cleanCategory, user);

  logSystemInfo('Order created successfully', {
    context: 'order-controller/createOrderController',
    userId,
    category: cleanCategory,
    orderId: result.baseOrderId,
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
