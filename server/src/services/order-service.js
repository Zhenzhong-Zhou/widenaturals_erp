/**
 * @file order-service.js
 * @description Business logic for order creation, retrieval, and status management.
 *
 * Exports:
 *   - createOrderService              – creates a base order and type-specific record
 *   - fetchPaginatedOrdersService     – paginated order list with access-scoped filters
 *   - fetchOrderDetailsByIdService    – full order detail with line items
 *   - updateOrderStatusService        – validates and applies an order status transition
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction }                  = require('../database/db');
const { validateIdExists }                 = require('../validators/entity-id-validators');
const { generateOrderIdentifiers }         = require('../utils/order-number-utils');
const {
  getOrderStatusIdByCode,
  getOrderStatusByCode,
  getOrderStatusMetadataById,
  getOrderStatusesByCodes,
}                                          = require('../repositories/order-status-repository');
const {
  insertOrder,
  findOrderByIdWithDetails,
  updateOrderStatus,
  fetchOrderMetadata,
  getPaginatedOrders,
}                                          = require('../repositories/order-repository');
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
}                                          = require('../business/order-business');
const AppError                             = require('../utils/AppError');
const {
  findOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId,
}                                          = require('../repositories/order-item-repository');
const {
  transformOrderWithItems,
  transformOrderStatusWithMetadata,
  transformPaginatedOrderTypes,
}                                          = require('../transformers/order-transformer');
const { getRoleById }                      = require('../repositories/role-repository');
const { getOrderTypeIdsByCategory }        = require('../repositories/order-type-repository');
const {
  extractStatusCodesAndFetchIds,
  extractStatusIds,
}                                          = require('../utils/order-status-utils');

const CONTEXT = 'order-service';

/**
 * Creates a base order record and the corresponding type-specific record
 * within a single transaction.
 *
 * @param {Object} orderData              - Order fields from the request.
 * @param {string} category               - Order category (e.g. `'sales'`, `'transfer'`).
 * @param {Object} user                   - Authenticated user.
 *
 * @returns {Promise<{ orderId: string }>}
 *
 * @throws {AppError} `validationError`    – invalid default status code.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createOrderService = async (orderData, category, user) => {
  const context = `${CONTEXT}/createOrderService`;
  
  try {
    return await withTransaction(async (client) => {
      const { order_type_id } = orderData;
      
      // 1. Validate order type exists.
      await validateIdExists('order_types', order_type_id, client, 'Order Type');
      
      // 2. Generate order number and UUID.
      const { id, orderNumber } = await generateOrderIdentifiers(order_type_id, category, client);
      
      // 3. Verify actor has permission to create this category of order.
      await verifyOrderCreationPermission(user, category, { action: 'CREATE' });
      
      // 4. Resolve default status ID.
      const status_id = await getOrderStatusIdByCode('ORDER_PENDING', client);
      
      if (!status_id) {
        throw AppError.validationError('Invalid default order status: ORDER_PENDING');
      }
      
      // 5. Insert base order record.
      const baseOrderId = await insertOrder(
        {
          id,
          order_number:        orderNumber,
          order_type_id:       orderData.order_type_id,
          order_date:          orderData.order_date,
          order_status_id:     status_id,
          created_by:          user.id,
          note:                orderData.note                ?? null,
          shipping_address_id: orderData.shipping_address_id ?? null,
          billing_address_id:  orderData.billing_address_id  ?? null,
          metadata:            orderData.metadata             ?? null,
        },
        client
      );
      
      // 6. Insert type-specific record (e.g. sales_orders, transfer_orders).
      await createOrderWithType(
        category,
        { ...orderData, id: baseOrderId, order_number: orderNumber, status_id },
        client
      );
      
      return { orderId: baseOrderId };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to create order.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches paginated orders scoped to the user's access level and order category.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]
 * @param {string}        options.category
 * @param {Object}        options.user
 * @param {number}        [options.page=1]
 * @param {number}        [options.limit=10]
 * @param {string}        [options.sortBy='createdAt']
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']
 *
 * @returns {Promise<PaginatedResult<OrderRow>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedOrdersService = async ({
                                             filters   = {},
                                             category,
                                             user,
                                             page      = 1,
                                             limit     = 10,
                                             sortBy    = 'createdAt',
                                             sortOrder = 'DESC',
                                           }) => {
  const context = `${CONTEXT}/fetchPaginatedOrdersService`;
  
  try {
    // 1. Verify actor has permission to view this category.
    await verifyOrderViewPermission(user, category, { action: 'VIEW' });
    
    // 2. Evaluate global and stage-based access flags.
    const userAccess = await evaluateOrdersViewAccessControl(user);
    
    // 3. Resolve applicable order type IDs for the category.
    let orderTypeIds;
    
    if (category !== 'all') {
      orderTypeIds = await getOrderTypeIdsByCategory(category);
    } else if (userAccess?.canViewAllOrders && filters?.orderCategory) {
      orderTypeIds = await getOrderTypeIdsByCategory(filters.orderCategory);
    }
    
    // 4. Resolve allowed status codes and map to IDs.
    const nextAllowedStatuses = getNextAllowedStatuses(category);
    const allowedStatusCodes  = extractStatusCodesAndFetchIds(nextAllowedStatuses);
    
    let allowedStatusIds = [];
    
    if (allowedStatusCodes.length > 0) {
      const allowedStatusRecords = await getOrderStatusesByCodes(allowedStatusCodes, null);
      allowedStatusIds           = extractStatusIds(allowedStatusRecords);
    }
    
    // 5. Apply access control to filters — type, stage, and status scoping.
    const scopedFilters = await applyOrderAccessFilters(
      filters,
      userAccess,
      orderTypeIds,
      allowedStatusIds
    );
    
    // 6. Execute paginated query with scoped filters.
    const rawResult = await getPaginatedOrders({
      filters: scopedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    return transformPaginatedOrderTypes(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch paginated orders.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Fetches full order detail with line items, filtered by the user's metadata access level.
 *
 * @param {string} category  - Order category for permission scoping.
 * @param {string} orderId   - UUID of the order to retrieve.
 * @param {Object} user      - Authenticated user.
 *
 * @returns {Promise<Object>} Transformed order detail with items.
 *
 * @throws {AppError} `notFoundError`   – order does not exist.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchOrderDetailsByIdService = async (category, orderId, user) => {
  const context = `${CONTEXT}/fetchOrderDetailsByIdService`;
  
  try {
    await verifyOrderViewPermission(user, category, { action: 'VIEW', orderId });
    
    const [header, items] = await Promise.all([
      findOrderByIdWithDetails(orderId),
      findOrderItemsByOrderId(orderId),
    ]);
    
    if (!header) {
      throw AppError.notFoundError('Order not found.');
    }
    
    const { canViewOrderMetadata, canViewOrderItemMetadata } =
      await evaluateOrderDetailsViewAccessControl(user);
    
    return transformOrderWithItems(/** @type {OrderDetailRow} */ (header), items, {
      includeOrderMetadata: canViewOrderMetadata,
      includeItemMetadata:  canViewOrderItemMetadata,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve order details.', {
      meta: { error: error.message, context },
    });
  }
};

/**
 * Validates and applies an order status transition, cascading to all order items.
 *
 * Validates the FSM transition, checks actor permission, updates order and item
 * statuses atomically, and returns enriched status metadata.
 *
 * @param {Object} user             - Authenticated user (requires `id` and `role`).
 * @param {string} categoryParam    - Category from the route — must match the order's category.
 * @param {string} orderId          - UUID of the order to update.
 * @param {string} nextStatusCode   - Target status code.
 *
 * @returns {Promise<{ enrichedOrder: Object, enrichedItems: Object[] }>}
 *
 * @throws {AppError} `authorizationError` – category mismatch or actor lacks permission.
 * @throws {AppError} `notFoundError`      – order not found after update.
 * @throws {AppError} `validationError`    – invalid transition or status inconsistency.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateOrderStatusService = async (user, categoryParam, orderId, nextStatusCode) => {
  const context = `${CONTEXT}/updateOrderStatusService`;
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // Attach roleName to user object for downstream permission checks.
      const { name: roleName } = await getRoleById(user.role, client);
      user.roleName = roleName;
      
      // 1. Validate order exists.
      await validateIdExists('orders', orderId, client, 'Orders');
      
      // 2. Fetch current order status metadata.
      const orderWithMeta = await fetchOrderMetadata(orderId, client);
      const {
        order_status_category: currentStatusCategory,
        order_status_code:     currentStatusCode,
        order_category:        orderCategory,
      } = orderWithMeta;
      
      // 3. Resolve target status metadata.
      const {
        id:       nextStatusId,
        category: nextStatusCategory,
        code:     resolvedNextStatusCode,
      } = await getOrderStatusByCode(nextStatusCode, client);
      
      // 4. Validate FSM transition rules.
      validateStatusTransitionByCategory(
        orderCategory,
        currentStatusCategory,
        nextStatusCategory,
        currentStatusCode,
        resolvedNextStatusCode
      );
      
      // 5. Guard against route vs. DB category mismatch.
      if (orderCategory !== categoryParam) {
        throw AppError.authorizationError(
          `Category mismatch. Cannot update ${orderCategory} order via ${categoryParam} route.`
        );
      }
      
      // 6. Check actor permission for this transition.
      const canUpdate = await canUpdateOrderStatus(user, orderCategory, orderWithMeta, nextStatusCode);
      
      if (!canUpdate) {
        throw AppError.authorizationError(
          `User role '${user.roleName}' is not allowed to update ${orderCategory} order to ${nextStatusCode}.`
        );
      }
      
      // 7. Apply order status update.
      const updatedOrder = await updateOrderStatus(client, {
        orderId,
        newStatusId: nextStatusId,
        updatedBy:   userId,
      });
      
      if (!updatedOrder) {
        throw AppError.notFoundError(
          `Order ${orderId} not found or already in status ${resolvedNextStatusCode}.`
        );
      }
      
      // 8. Cascade status update to all order items.
      const updatedItems = await updateOrderItemStatusesByOrderId(client, {
        orderId,
        newStatusId: nextStatusId,
        updatedBy:   userId,
      });
      
      // 9. Validate order/item status consistency after update.
      const inconsistentStatus = updatedItems.some(
        (item) => item.status_id !== updatedOrder.order_status_id
      );
      
      if (inconsistentStatus) {
        throw AppError.validationError('Mismatch between order and item status after update.');
      }
      
      // 10. Enrich and return status metadata.
      const orderStatusMetadata = await getOrderStatusMetadataById(
        updatedOrder.order_status_id,
        client
      );
      
      const { enrichedOrder, enrichedItems } = enrichStatusMetadata({
        updatedOrder,
        updatedItems,
        orderStatusMetadata,
      });
      
      return transformOrderStatusWithMetadata({ enrichedOrder, enrichedItems });
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to update order status.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  createOrderService,
  fetchPaginatedOrdersService,
  fetchOrderDetailsByIdService,
  updateOrderStatusService,
};
