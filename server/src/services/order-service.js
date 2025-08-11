const { withTransaction } = require('../database/db');
const { validateIdExists } = require('../validators/entity-id-validators');
const { generateOrderIdentifiers } = require('../utils/order-number-utils');
const {
  getOrderStatusIdByCode,
} = require('../repositories/order-status-repository');
const { insertOrder } = require('../repositories/order-repository');
const {
  createOrderWithType,
  verifyOrderCreationPermission,
} = require('../business/order-business');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Service function to create a new order within the specified category.
 *
 * This function:
 * - Validates that the provided `order_type_id` exists and matches the category.
 * - Generates a new order ID and order number.
 * - Verifies the user's permission to create the specified order category.
 * - Inserts the base order record.
 * - Delegates type-specific insert logic (e.g., sales, transfer).
 *
 * @param {object} orderData - Full order payload, including base and subtype fields. Must contain `order_type_id`.
 * @param {string} category - The order category (e.g., 'sales', 'purchase', 'transfer').
 * @param {object} user - Authenticated user object (must include at least `id` and `role`).
 *
 * @returns {Promise<object>} - Result containing created order IDs:
 *   {
 *     baseOrderId: string, // ID of the base order
 *   }
 *
 * @throws {AppError} - If validation fails, permission is denied, or DB operations fail.
 *
 * @example
 * const result = await createOrderService(orderData, 'sales', currentUser);
 * console.log(result); // { baseOrderId: '...' }
 */
const createOrderService = async (orderData, category, user) => {
  try {
    return await withTransaction(async (client) => {
      const { order_type_id } = orderData;

      // 1. Validate order type exists
      await validateIdExists(
        'order_types',
        order_type_id,
        client,
        'Order Type'
      );

      // 2. Generate order number
      const { id, orderNumber } = await generateOrderIdentifiers(
        order_type_id,
        category,
        client
      );

      // 3. Verify permission to create this category of order
      await verifyOrderCreationPermission(user, category);

      // 4. Get default status ID
      const status_id = await getOrderStatusIdByCode('ORDER_PENDING', client);
      if (!status_id) {
        throw AppError.validationError(
          'Invalid default order status: ORDER_PENDING'
        );
      }

      // 5. Insert base order
      const baseOrderId = await insertOrder(
        {
          ...orderData,
          id,
          order_number: orderNumber,
          order_status_id: status_id,
        },
        client
      );

      // 6. Insert type-specific order (e.g., into sales_orders, transfer_orders)
      await createOrderWithType(
        category,
        {
          ...orderData,
          id: baseOrderId,
          order_number: orderNumber,
          status_id,
        },
        client
      );
      
      // 7. Return result
      // Returning orderId (same as baseOrderId); typeOrderId omitted for now since they're identical.
      // Adjust later if typeOrderId diverges from baseOrderId.
      return { orderId: baseOrderId };
    });
  } catch (error) {
    logSystemException(error, 'Failed to create order', {
      context: 'order-service/createOrderService',
      category,
      orderData,
    });
    throw AppError.businessError('Unable to create order');
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
 * @throws {AppError} - If order ID is missing, or order cannot be confirmed.
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
  createOrderService,
  fetchOrderDetails,
  fetchAllOrdersService,
  fetchAllocationEligibleOrdersService,
  confirmOrderService,
  fetchAllocationEligibleOrderDetails,
};
