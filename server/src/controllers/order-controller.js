const {
  createOrderByType,
  fetchOrderDetails,
  fetchAllOrdersService,
  confirmOrderService,
  fetchAllocationEligibleOrdersService,
  fetchAllocationEligibleOrderDetails,
} = require('../services/order-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { logError } = require('../utils/logger-helper');

/**
 * API Controller for creating an order.
 */
const createOrderController = wrapAsync(async (req, res, next) => {
  try {
    const { orderTypeId } = req.params; // Extract order type ID from URL
    const orderData = req.body;

    if (!orderTypeId) {
      throw AppError.validationError('Order type is required.');
    }

    orderData.created_by = req.user.id; // Extract `created_by` from token
    orderData.order_type_id = orderTypeId; // Assign order type ID

    const { salesOrder } = await createOrderByType(orderData);
    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      salesOrderId: salesOrder.id,
    });
  } catch (error) {
    next(error);
  }
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
  getOrderDetailsController,
  getAllOrdersController,
  getAllocationEligibleOrdersController,
  confirmOrderController,
  getAllocationEligibleOrderDetailsController,
};
