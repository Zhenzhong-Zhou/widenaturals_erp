const {
  createOrder,
  getOrderDetailsById, getAllOrders,
} = require('../repositories/order-repository');
const { createSalesOrder } = require('../repositories/sales-order-repository');
const {
  getOrderTypeByIdOrName, checkOrderTypeExists,
} = require('../repositories/order-type-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { transformOrderDetails, transformAllOrders, transformUpdatedOrderStatusResult } = require('../transformers/order-transformer');
const { applyOrderDetailsBusinessLogic, validateOrderNumbers, confirmOrderWithItems, canConfirmOrder } = require('../business/order-business');
const { withTransaction } = require('../database/db');

/**
 * Creates an order dynamically based on its type.
 * Dynamically determines order processing based on category.
 *
 * @param {Object} orderData - Order details.
 * @returns {Promise<Object>} - The created order.
 */
const createOrderByType = async (orderData) => {
  // Step 1: Check if order type exists
  const orderTypeExists = await checkOrderTypeExists(orderData.order_type_id);
  
  if (!orderTypeExists) {
    throw AppError.validationError('Invalid order type provided.');
  }
  
  // Step 2: Fetch order type details based on `order_type_id`
  const orderType = await getOrderTypeByIdOrName({
    id: orderData.order_type_id,
  });
  
  if (!orderType) {
    throw AppError.databaseError('Failed to fetch order type details.');
  }
  
  // Step 3: Route to the correct order creation function
  switch (orderType.category) {
    case 'sales':
      return createSalesOrder(orderData);
    
    case 'purchase':
    case 'transfer':
    case 'return':
    case 'manufacturing':
    case 'adjustment':
    case 'logistics':
      return createOrder(orderData);
    
    default:
      throw AppError.validationError(
        `Unsupported order category: ${orderType.category}`
      );
  }
};

/**
 * Fetches and processes order details from the repository.
 *
 * @param {string} orderId - The order ID to fetch.
 * @param {object} user - The user making the request (includes permissions).
 * @returns {object} - Processed order details.
 */
const fetchOrderDetails = async (orderId, user) => {
  if (!orderId) {
    throw AppError.validationError('Order ID is required.');
  }
  
  // Fetch order details from the repository
  const orderRows = await getOrderDetailsById(orderId);
  
  if (!orderRows || orderRows.length === 0) {
    throw AppError.notFoundError(`Order with ID ${orderId} not found.`);
  }
  
  // Transform Data
  const transformedOrder = transformOrderDetails(orderRows);
  
  // Apply Business Logic with User Permissions
  return applyOrderDetailsBusinessLogic(transformedOrder, user);
};

/**
 * Service function to fetch all orders with verification and transformation.
 *
 * @param {Object} options - Fetch options for the query.
 * @param {number} options.page - The current page number (default: 1).
 * @param {number} options.limit - The number of orders per page (default: 10).
 * @param {string} options.sortBy - The column to sort the results by (default: 'created_at').
 * @param {string} options.sortOrder - The order of sorting ('ASC' or 'DESC', default: 'DESC').
 * @param {boolean} options.verifyOrderNumbers - Whether to verify order numbers using checksum (default: true).
 * @returns {Promise<Object>} - The paginated orders result with transformed data.
 */
const fetchAllOrdersService = async ({
                                       page = 1,
                                       limit = 10,
                                       sortBy = 'created_at',
                                       sortOrder = 'DESC',
                                       verifyOrderNumbers = true
                                     } = {}) => {
  try {
    // Fetching raw order data from repository
    const result = await getAllOrders({ page, limit, sortBy, sortOrder });
    
    // Transforming the raw data
    const transformedOrders = transformAllOrders(result.data);
    
    // Validating order numbers
    const validatedOrders = validateOrderNumbers(transformedOrders, verifyOrderNumbers);
    
    return { ...result, data: validatedOrders };
  } catch (error) {
    logError('Error fetching all orders:', error);
    throw AppError.databaseError('Failed to fetch all orders');
  }
};

/**
 * Service to confirm an order and its associated order items.
 * Validates the order's current status before proceeding.
 *
 * @param {string} orderId - The ID of the order to confirm.
 * @param {object} user - The user performing the confirmation.
 * @returns {Promise<object>} - Transformed result of the confirmed order.
 * @throws {AppError} - If order ID is missing or order cannot be confirmed.
 */
const confirmOrderService = async (orderId, user) => {
  if (!orderId) {
    throw AppError.validationError('Order ID is required to confirm the order.');
  }
  
  return await withTransaction(async (client) => {
    // Step 1: Validate if the order and its items can be confirmed
    const isConfirmable = await canConfirmOrder(orderId, client);
    
    if (!isConfirmable) {
      throw AppError.validationError(`Order cannot be confirmed from its current status or item statuses.`);
    }
    
    // Step 2: Confirm the order and items in the database
    const rawResult = await confirmOrderWithItems(orderId, user, client);
    
    // Step 3: Transform and return the final confirmed result
    return transformUpdatedOrderStatusResult(rawResult);
  });
};

module.exports = {
  createOrderByType,
  fetchOrderDetails,
  fetchAllOrdersService,
  confirmOrderService,
};
