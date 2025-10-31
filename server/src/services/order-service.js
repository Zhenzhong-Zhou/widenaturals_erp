const { withTransaction } = require('../database/db');
const { validateIdExists } = require('../validators/entity-id-validators');
const { generateOrderIdentifiers } = require('../utils/order-number-utils');
const {
  getOrderStatusIdByCode,
  getOrderStatusByCode,
  getOrderStatusMetadataById,
  getOrderStatusesByCodes,
} = require('../repositories/order-status-repository');
const {
  insertOrder,
  findOrderByIdWithDetails,
  updateOrderStatus,
  fetchOrderMetadata, getPaginatedOrders
} = require('../repositories/order-repository');
const {
  createOrderWithType,
  verifyOrderCreationPermission,
  verifyOrderViewPermission,
  evaluateOrdersViewAccessControl,
  evaluateOrderDetailsViewAccessControl,
  validateStatusTransitionByCategory,
  canUpdateOrderStatus,
  enrichStatusMetadata,
  applyOrderAccessFilters,
  getNextAllowedStatuses,
} = require('../business/order-business');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const {
  findOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId
} = require('../repositories/order-item-repository');
const {
  transformOrderWithItems,
  transformOrderStatusWithMetadata,
  transformPaginatedOrderTypes
} = require('../transformers/order-transformer');
const { getRoleNameById } = require('../repositories/role-repository');
const { getOrderTypeIdsByCategory } = require('../repositories/order-type-repository');
const { extractStatusCodesAndFetchIds, extractStatusIds } = require('../utils/order-status-utils');

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
    throw AppError.serviceError('Unable to create order');
  }
};

/**
 * Fetches a paginated and access-controlled list of orders for a given category.
 *
 * This service:
 * - Verifies the user's permission to view orders in the specified `category` (including `'all'`).
 * - Evaluates whether the user has full/global access or restricted access by order type or stage.
 * - Resolves `orderTypeId`s based on:
 *   - The explicit `category` route param (if not `'all'`), or
 *   - The `filters.orderCategory` (if category is `'all'` and user has global access).
 * - Determines allowed status codes based on the category (via virtual stage maps) and resolves them to internal status IDs.
 * - Applies access control filters using `applyOrderAccessFilters`, which combines type-level, stage-level, and global permissions.
 * - Delegates the filtered query to the repository (`getPaginatedOrders`) for execution.
 * - Transforms the raw database result into a client-facing format with `data` and `pagination` metadata.
 *
 * Special behavior:
 * - If `category` is `'all'` and the user has global access, filters are not restricted by order type
 *   unless `filters.orderCategory` is explicitly provided.
 * - If no valid stage-based statuses are found, access filtering will fallback gracefully without blocking category-based results.
 * - Route-level category validation should occur separately via middleware or route schema.
 *
 * @async
 * @param {Object} params - Parameters for fetching paginated orders
 * @param {Object} params.filters - Query filters (e.g., order number, type, status, keyword, date range)
 * @param {string} params.category - Order category from the route (e.g. `'sales'`, `'purchase'`, `'allocatable'`, or `'all'`)
 * @param {Object} params.user - Authenticated user object (must include permissions context)
 * @param {number} [params.page=1] - Page number for pagination
 * @param {number} [params.limit=10] - Page size for pagination
 * @param {string} [params.sortBy='created_at'] - Column to sort by
 * @param {string} [params.sortOrder='DESC'] - Sort direction (`'ASC'` or `'DESC'`)
 *
 * @returns {Promise<Object>} - Transformed paginated result including `data` and `pagination` metadata
 *
 * @throws {AppError} - If permission verification, access filtering, or database query execution fails
 */
const fetchPaginatedOrdersService = async ({
                                             filters = {},
                                             category,
                                             user,
                                             page = 1,
                                             limit = 10,
                                             sortBy = 'created_at',
                                             sortOrder = 'DESC',
                                           }) => {
  try {
    // Step 1: Verify that user has permission to view this category
    await verifyOrderViewPermission(user, category, { action: 'VIEW' });
    
    // Step 2: Evaluate user's global and stage-based access flags
    const userAccess = await evaluateOrdersViewAccessControl(user);
    
    // Step 3: Resolve applicable order type IDs:
    // - If category !== 'all', fetch order types normally.
    // - If category === 'all' and user has full access, but filters.orderCategory is provided,
    //   treat it like a scoping hint and fetch order types accordingly.
    let orderTypeIds;
    
    if (category !== 'all') {
      orderTypeIds = await getOrderTypeIdsByCategory(category);
    } else if (userAccess?.canViewAllOrders && filters?.orderCategory) {
      orderTypeIds = await getOrderTypeIdsByCategory(filters.orderCategory);
    }
    
    // Step 4: Get allowed status codes for this category (based on virtual stage map)
    const nextAllowedStatuses = getNextAllowedStatuses(category);
    
    // Step 5: Map those codes to internal status IDs
    const allowedStatusCodes = extractStatusCodesAndFetchIds(nextAllowedStatuses);
    
    // Skip DB lookup if no status codes
    let allowedStatusIds = [];
    if (allowedStatusCodes.length > 0) {
      const allowedStatusRecords = await getOrderStatusesByCodes(allowedStatusCodes);
      allowedStatusIds = extractStatusIds(allowedStatusRecords);
    }
    
    // Step 6: Apply access control to filters (type, stage, and status scoping)
    const scopedFilters = await applyOrderAccessFilters(
      filters,
      userAccess,
      orderTypeIds,
      allowedStatusIds
    );
    
    // Step 7: Run paginated query with scoped filters
    const rawResult = await getPaginatedOrders({
      filters: scopedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Step 8: Transform raw rows into API response structure
    return transformPaginatedOrderTypes(rawResult);
  } catch (error) {
    // Step 9: Log the error with full trace and re-throw a structured business error
    logSystemException(error, 'Failed to fetch paginated orders', {
      context: 'order-service/fetchPaginatedOrdersService',
      userId: user?.id,
      category,
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    throw AppError.serviceError('Unable to fetch paginated orders', {
      details: error.message,
      stage: 'fetch-paginated-orders',
      cause: error,
    });
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
 *   4. Evaluates order-level and line-item-level access rules via `evaluateOrderDetailsViewAccessControl(user)`.
 *   5. Transforms the raw DB rows into a structured `TransformedOrder` object using `transformOrderWithItems`.
 *   6. Logs key events for auditing.
 *
 * Access control:
 *   - `canViewOrderMetadata` → controls inclusion of order-level metadata in the response.
 *   - `canViewOrderItemMetadata` → controls inclusion of item-level metadata in the response.
 *
 * @async
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
    } = await evaluateOrderDetailsViewAccessControl(user);
    
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
    throw AppError.serviceError('Unable to retrieve order details at this time');
  }
};

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
    const updatedItems = await updateOrderItemStatusesByOrderId(client, {
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

module.exports = {
  createOrderService,
  fetchPaginatedOrdersService,
  fetchOrderDetailsByIdService,
  updateOrderStatusService,
};
