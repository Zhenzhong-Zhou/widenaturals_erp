const {
  createOrderByType,
  fetchOrderDetails,
} = require('../services/order-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { getUser } = require('../repositories/user-repository');

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

    const responseUser = await getUser(null, 'email', 'root@widenaturals.com');
    orderData.created_by = responseUser.id;

    // orderData.created_by = req.user.id; // Extract `created_by` from token
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

  if (!orderId) {
    throw AppError.validationError('Order ID is required.');
  }

  const orderDetails = await fetchOrderDetails(orderId, req.client);

  if (!orderDetails) {
    throw AppError.notFoundError(`Order with ID ${orderId} not found.`);
  }

  res.status(200).json({
    success: true,
    message: 'Order details retrieved successfully.',
    data: orderDetails,
  });
});

module.exports = {
  createOrderController,
  getOrderDetailsController,
};
