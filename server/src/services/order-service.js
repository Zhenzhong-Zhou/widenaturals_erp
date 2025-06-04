const {
  createOrder,
  getOrderDetailsById,
  getAllOrders,
  getAllocationEligibleOrders,
  getOrderAllocationDetailsById,
} = require('../repositories/order-repository');
const { createSalesOrder } = require('../repositories/sales-order-repository');
const {
  getOrderTypeByIdOrName,
  checkOrderTypeExists,
} = require('../repositories/order-type-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const {
  transformOrderDetails,
  transformOrders,
  transformUpdatedOrderStatusResult,
  transformOrderAllocationDetails,
} = require('../transformers/order-transformer');
const {
  applyOrderDetailsBusinessLogic,
  validateOrderNumbers,
  confirmOrderWithItems,
  canConfirmOrder,
} = require('../business/order-business');
const { withTransaction } = require('../database/db');
const { verifyOrderNumber } = require('../utils/order-number-utils');
const { checkPermissions } = require('./role-permission-service');

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
 * Internal helper to fetch, transform, and validate orders from a given fetch function.
 *
 * @param {Function} fetchFn - The repository function to fetch raw order data.
 * @param {Object} options - The query and transformation options.
 * @param {object} [options.user] - The user object (must include `id` and `role`) for permission checks.
 * @param {string[]} [options.requiredPermissions] - Permissions required to access the order data.
 * @param {boolean} [options.requireAllPermissions=false] - Whether to require all permissions (vs. any).
 * @returns {Promise<Object>} - Transformed and optionally validated order data.
 */
const handleOrderServiceFetch = async (
  fetchFn,
  {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    verifyOrderNumbers = true,
    user,
    requiredPermissions = [],
    requireAllPermissions = false,
  } = {}
) => {
  try {
    // Permission check if requiredPermissions are defined
    if (user && requiredPermissions.length > 0) {
      const hasAccess = await checkPermissions(user, requiredPermissions, {
        requireAll: requireAllPermissions,
      });

      if (!hasAccess) {
        throw AppError.authorizationError(
          'You do not have permission to access these orders.'
        );
      }
    }

    // Fetch, transform, validate
    const result = await fetchFn({ page, limit, sortBy, sortOrder });

    const transformedOrders = transformOrders(result.data);

    const validatedOrders = validateOrderNumbers(
      transformedOrders,
      verifyOrderNumbers
    );

    return { ...result, data: validatedOrders };
  } catch (error) {
    logError('Error in order service fetch:', error);
    throw AppError.databaseError('Failed to fetch orders');
  }
};

/**
 * Service function to fetch all orders with transformation and verification.
 */
const fetchAllOrdersService = (options = {}) =>
  handleOrderServiceFetch(getAllOrders, {
    ...options,
    requiredPermissions: ['view_all_order_details'],
  });

/**
 * Service function to fetch orders eligible for inventory allocation,
 * including confirmed, allocating, allocated, and partially fulfilled statuses.
 *
 * @param {Object} options - Query options for fetching orders.
 * @returns {Promise<Object>} - Paginated and filtered list of allocation-eligible orders.
 */
const fetchAllocationEligibleOrdersService = (options = {}) =>
  handleOrderServiceFetch(getAllocationEligibleOrders, {
    ...options,
    requiredPermissions: [
      'view_allocation_details',
      'view_full_sales_order_details',
    ],
    requireAllPermissions: false, // only one is needed
  });

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
    throw AppError.validationError(
      'Order ID is required to confirm the order.'
    );
  }

  return await withTransaction(async (client) => {
    // Step 1: Validate if the order and its items can be confirmed
    const isConfirmable = await canConfirmOrder(orderId, client);

    if (!isConfirmable) {
      throw AppError.validationError(
        `Order cannot be confirmed from its current status or item statuses.`
      );
    }

    // Step 2: Confirm the order and items in the database
    const rawResult = await confirmOrderWithItems(orderId, user, client);

    // Step 3: Transform and return the final confirmed result
    return transformUpdatedOrderStatusResult(rawResult);
  });
};

/**
 * Fetch and transform an order eligible for inventory allocation,
 * ensuring the order exists, is in a valid status, and the user has access.
 *
 * @param {string} orderId - The order ID.
 * @param {object} user - The current user performing the request.
 * @returns {Promise<object>} - Transformed order with items.
 * @throws {AppError} - If the order is not allocation-eligible or permissions fail.
 */
const fetchAllocationEligibleOrderDetails = async (orderId, user) => {
  const rows = await getOrderAllocationDetailsById(orderId);
  const order = transformOrderAllocationDetails(rows);

  if (!order) {
    throw AppError.notFoundError('Order not found or not confirmed.');
  }

  const isValid = verifyOrderNumber(order.order_number);

  if (!isValid) {
    const canViewInvalid = await checkPermissions(user, [
      'root_access',
      'view_all_order_details',
      'view_order_allocation_details',
    ]);

    if (!canViewInvalid) {
      throw AppError.validationError('Order number is invalid or not found.');
    }
  }

  return order;
};

module.exports = {
  createOrderByType,
  fetchOrderDetails,
  fetchAllOrdersService,
  fetchAllocationEligibleOrdersService,
  confirmOrderService,
  fetchAllocationEligibleOrderDetails,
};
