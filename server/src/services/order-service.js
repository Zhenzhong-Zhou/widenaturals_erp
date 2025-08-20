const { withTransaction } = require('../database/db');
const { validateIdExists } = require('../validators/entity-id-validators');
const { generateOrderIdentifiers } = require('../utils/order-number-utils');
const {
  getOrderStatusIdByCode, getOrderStatusByCode, getOrderStatusMetadataById,
} = require('../repositories/order-status-repository');
const {
  insertOrder,
  findOrderByIdWithDetails,
  updateOrderStatus,
  fetchOrderMetadata
} = require('../repositories/order-repository');
const {
  createOrderWithType,
  verifyOrderCreationPermission,
  verifyOrderViewPermission,
  evaluateOrderAccessControl,
  validateStatusTransitionByCategory,
  canUpdateOrderStatus, enrichStatusMetadata, enrichStatusMetadataWithMultiple,
} = require('../business/order-business');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const { findOrderItemsByOrderId, updateOrderItemStatuses } = require('../repositories/order-item-repository');
const { transformOrderWithItems, transformOrderStatusWithMetadata } = require('../transformers/order-transformer');
const { getRoleNameById } = require('../repositories/role-repository');

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
      await verifyOrderCreationPermission(user, category, { action: 'CREATE' });

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
 * Service: fetchOrderDetailsByIdService
 *
 * Retrieves and transforms full order details (header + line items) for a given order category and ID.
 *
 * Workflow:
 *   1. Verifies that the user has permission to view the order (`verifyOrderViewPermission`).
 *   2. Loads the order header and items in parallel.
 *   3. Throws a `NotFoundError` if no header is found.
 *   4. Evaluates order-level and line-item-level access rules via `evaluateOrderAccessControl(user)`.
 *   5. Transforms the raw DB rows into a structured `TransformedOrder` object using `transformOrderWithItems`.
 *   6. Logs key events for auditing.
 *
 * Access control:
 *   - `canViewOrderMetadata` → controls inclusion of order-level metadata in the response.
 *   - `canViewOrderItemMetadata` → controls inclusion of item-level metadata in the response.
 *
 * @async
 * @function fetchOrderDetailsByIdService
 * @param {string} category - Order category key (e.g., "sales", "purchase", "transfer").
 * @param {string} orderId - UUID v4 of the order to fetch.
 * @param {object} user - Authenticated user object (must include ID and permission context).
 * @returns {Promise<{
 *   id: string,
 *   orderNumber: string,
 *   orderDate: string|Date|null,
 *   statusDate: string|Date|null,
 *   note: string|null,
 *   type: { id: string, name: string },
 *   status: { id: string, name: string },
 *   customer: { id: string, fullName: string, email: string|null, phone: string|null },
 *   payment: object,
 *   discount: object|null,
 *   tax: object|null,
 *   shippingFee: number|null,
 *   totalAmount: number|null,
 *   deliveryMethod: { id: string, name: string },
 *   metadata?: object,
 *   shippingAddress: BuiltAddressUserFacing|null,
 *   billingAddress: BuiltAddressUserFacing|null,
 *   audit: {
 *     createdAt: string|null,
 *     createdBy: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null },
 *     updatedAt?: string|null,
 *     updatedBy?: { id?: string|null, name?: string|null, firstName?: string|null, lastName?: string|null }
 *   },
 *   items: Array<object>
 * }>}
 *
 * @throws {AppError}
 *   - `authorizationError` if the user lacks permission.
 *   - `notFoundError` if the order does not exist.
 *   - `databaseError` if an unexpected DB/repository error occurs.
 *
 * @example
 * const order = await fetchOrderDetailsByIdService('sales', '550e8400-e29b-41d4-a716-446655440000', currentUser);
 */
const fetchOrderDetailsByIdService = async (category, orderId, user) => {
  try {
    await verifyOrderViewPermission(user, category, { action: 'VIEW', orderId});
    
    const [header, items] = await Promise.all([
      findOrderByIdWithDetails(orderId),
      findOrderItemsByOrderId(orderId),
    ]);
    
    if (!header) {
      logSystemInfo('Order not found', {
        context: 'order-service/fetchOrderDetailsByIdService',
        orderId,
        userId: user?.id,
        severity: 'INFO',
      });
      throw AppError.notFoundError('Order not found');
    }
    
    // Evaluate once; avoid multiple permission queries
    const {
      canViewOrderMetadata,
      canViewOrderItemMetadata,
    } = await evaluateOrderAccessControl(user);
    
    const transformed = transformOrderWithItems(header, items, {
      includeOrderMetadata: canViewOrderMetadata,
      includeItemMetadata: canViewOrderItemMetadata,
      // keep your defaults for addresses/display name inside the transformer or pass explicitly here
    });
    
    logSystemInfo('Fetched order details', {
      context: 'order-service/fetchOrderDetailsByIdService',
      orderId,
      userId: user?.id,
      includeOrderMetadata: canViewOrderMetadata,
      includeItemMetadata: canViewOrderItemMetadata,
      severity: 'INFO',
    });
    
    return transformed;
  } catch (err) {
    logSystemException(err, 'Failed to fetch order details', {
      context: 'order-service/fetchOrderDetailsByIdService',
      orderId,
      userId: user?.id,
    });
    // Wrap non-AppError errors into a domain error
    throw AppError.databaseError('Unable to retrieve order details at this time');
  }
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
 * Updates the status of a sales order and all associated items within a single DB transaction.
 *
 * Enforces FSM-based transitions, category-level permissions, and audit logging.
 *
 * Workflow:
 * 1. Validate the existence of the target order.
 * 2. Fetch current order status, category, and metadata.
 * 3. Resolve the next status object (by code).
 * 4. Validate the status transition using FSM rules.
 * 5. Prevent cross-category spoofing from route param vs DB data.
 * 6. Enforce role/permission-based access control.
 * 7. Update the order's status and timestamp.
 * 8. Cascade the status update to all related order items.
 * 9. Log the structured system-level status change audit.
 * 10. Enrich both order and items with human-readable status metadata.
 *
 * @async
 * @param {object} user - Authenticated user performing the update. Mutated with `roleName` for downstream logic.
 * @param {string} categoryParam - Order category from the route (e.g., "sales", "purchase").
 * @param {string} orderId - UUID of the order to update.
 * @param {string} nextStatusCode - Status code to transition to (e.g., "ORDER_CONFIRMED").
 * @returns {Promise<{ enrichedOrder: object, enrichedItems: object[] }>} - Transformed order and items with camelCase status metadata.
 *
 * @throws {AppError} - On validation, authorization, or transition errors.
 */
const updateOrderStatusService = async (user, categoryParam, orderId, nextStatusCode) => {
  return await withTransaction(async (client) => {
    const userId = user.id;
    
    // Step 0: Attach roleName (e.g., "admin", "sales") to user for downstream permission checks
    const { name: roleName } = await getRoleNameById(user.role, client);
    user.roleName = roleName;
    
    // Step 1: Validate that the order exists
    await validateIdExists('orders', orderId, client, 'Orders');
    
    // Step 2: Get current order status metadata
    const orderWithMeta = await fetchOrderMetadata(orderId, client);
    const {
      order_status_category: currentStatusCategory,
      order_status_code: currentStatusCode,
      order_category: orderCategory,
    } = orderWithMeta;
    
    // Step 3: Resolve full metadata for the target status code
    const {
      id: nextStatusId,
      category: nextStatusCategory,
      code: resolvedNextStatusCode,
    } = await getOrderStatusByCode(nextStatusCode, client);
    
    // Step 4: Validate transition using FSM rules
    validateStatusTransitionByCategory(
      orderCategory,
      currentStatusCategory,
      nextStatusCategory,
      currentStatusCode,
      resolvedNextStatusCode
    );
    
    // Step 5: Protect against route vs. DB category mismatch
    if (orderCategory !== categoryParam) {
      throw AppError.authorizationError(
        `Category mismatch. Cannot update ${orderCategory} order via ${categoryParam} route.`
      );
    }
    
    // Step 6: Check user permission to perform this transition
    const canUpdate = await canUpdateOrderStatus(user, orderCategory, orderWithMeta, nextStatusCode);
    
    if (!canUpdate) {
      throw AppError.authorizationError(
        `User role '${user.roleName}' is not allowed to update ${orderCategory} order to ${nextStatusCode}.`
      );
    }
    
    // Step 7: Update the order status
    const updatedOrder = await updateOrderStatus(client, {
      orderId,
      newStatusId: nextStatusId,
      updatedBy: userId,
    });
    
    if (!updatedOrder) {
      throw AppError.notFoundError(
        `Order ${orderId} not found or already in status ${resolvedNextStatusCode}.`
      );
    }
    
    // Step 8: Cascade update to all order items
    const updatedItems = await updateOrderItemStatuses(client, {
      orderId,
      newStatusId: nextStatusId,
      updatedBy: userId,
    });
    
    // Step 9: Log the status update for audit purposes
    logSystemInfo('Order status updated', {
      context: 'order-service/updateOrderStatusService',
      orderId,
      previousStatus: currentStatusCode,
      newStatus: resolvedNextStatusCode,
      updatedBy: userId,
      role: user.roleName,
    });
    
    // Step 10: Validate consistency and enrich response
    const inconsistentStatus = updatedItems.some(
      (item) => item.status_id !== updatedOrder.order_status_id
    );
    
    if (inconsistentStatus) {
      throw AppError.validationError(
        'Mismatch between order and item status after update.'
      );
    }
    
    const orderStatusMetadata = await getOrderStatusMetadataById(
      updatedOrder.order_status_id,
      client
    );
    
    const { enrichedOrder, enrichedItems } = enrichStatusMetadata({
      updatedOrder,
      updatedItems,
      orderStatusMetadata,
    });
    
    // Return the transformed records with camelCase metadata fields
    return transformOrderStatusWithMetadata({ enrichedOrder, enrichedItems });
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
  fetchOrderDetailsByIdService,
  fetchAllOrdersService,
  fetchAllocationEligibleOrdersService,
  updateOrderStatusService,
  fetchAllocationEligibleOrderDetails,
};
