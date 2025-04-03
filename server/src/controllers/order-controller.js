const {
  createOrderByType,
  fetchOrderDetails, fetchAllOrdersService, confirmOrderService,
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
  const user= req.user;

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
 * Controller to fetch all orders with pagination, sorting, and order number validation.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The middleware function to handle errors.
 * @returns {Promise<void>}
 */
const getAllOrdersController = wrapAsync(async (req, res, next) => {
  try {
    // Extracting query parameters from the request
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      verifyOrderNumbers = true
    } = req.query;
    
    // Convert 'verifyOrderNumbers' to boolean if necessary
    const verifyOrderNumbersBool = verifyOrderNumbers !== 'false';
    
    // Fetching orders from the service layer
    const result = await fetchAllOrdersService({
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
      verifyOrderNumbers: verifyOrderNumbersBool
    });
    
    // Responding with a successful JSON response
    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logError('Error in fetchAllOrdersController:', error);
    next(error);
  }
});

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
      message: 'Order successfully confirmed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  createOrderController,
  getOrderDetailsController,
  getAllOrdersController,
  confirmOrderController,
};
