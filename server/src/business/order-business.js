const { checkPermissions, resolveUserPermissionContext } = require('../services/role-permission-service');
const AppError = require('../utils/AppError');
const { logSystemWarn, logSystemException } = require('../utils/system-logger');
const { createSalesOrder } = require('./sales-order-business');
const {
  resolveOrderAccessContext,
} = require('../services/role-permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/order-constants');

/**
 * Checks whether the given user has permission to perform an order action
 * (defaults to creating) for a specific order category.
 *
 * This function:
 * - Resolves the user's accessible categories via `resolveOrderAccessContext`.
 * - Grants unconditional access for root users.
 * - Logs and throws an authorization error if the category is not accessible.
 *
 * @async
 * @param {object} user - The authenticated user object (must include `role` and related access context).
 * @param {string} category - Order category key (e.g., "sales", "purchase", "transfer").
 * @param {object} [options] - Optional settings.
 * @param {'VIEW'|'CREATE'|'UPDATE'|'DELETE'} [options.action='CREATE'] - Action to check permission for.
 * @returns {Promise<void>} Resolves if permission is granted; rejects with `AppError` if denied.
 *
 * @throws {AppError} Authorization error if the user lacks permission.
 */
const verifyOrderCreationPermission = async (user, category, { action = 'CREATE' } = {}) => {
  const { isRoot, accessibleCategories } =
    await resolveOrderAccessContext(user, { action });

  if (isRoot) return;

  if (!accessibleCategories.includes(category)) {
    logSystemWarn('Permission denied for order creation', {
      context: 'verifyOrderCreationPermission',
      role: user.role,
      attemptedCategory: category,
      accessibleCategories,
    });

    throw AppError.authorizationError(
      `You do not have permission to create ${category} orders.`
    );
  }
};

/**
 * Order creation strategy map
 */
const orderCreationStrategies = {
  sales: createSalesOrder,
  // TRANSFER: createTransferOrder,
  // PURCHASE: createPurchaseOrder,
};

/**
 * Creates an order based on the specified category using the mapped strategy.
 *
 * This function:
 * - Look up the creation strategy for the given category.
 * - Delegates the insert logic to the corresponding strategy function.
 *
 * @param {string} category - The order category (e.g., 'sales', 'purchase', 'transfer').
 * @param {object} orderData - Full order payload.
 * @param {PoolClient} client - DB client within transaction.
 * @returns {Promise<object>} - Inserted order object (type-specific).
 * @throws {AppError} - If category is unsupported or creation fails.
 */
const createOrderWithType = async (category, orderData, client) => {
  const createFn = orderCreationStrategies[category];

  if (!createFn) {
    throw AppError.validationError(`Unsupported order category: ${category}`);
  }

  return await createFn(orderData, client);
};

/**
 * Verifies if the user has permission to VIEW an order of the specified category.
 * Uses dynamic permission naming + resolveOrderAccessContext for consistency.
 *
 * @param {object} user - Authenticated user object.
 * @param {string} category - Order category (e.g., 'sales', 'purchase', 'transfer').
 * @param {{ action?: 'VIEW'|'CREATE'|'UPDATE'|'DELETE', orderId?: string }} [opts]
 *   - action: Defaults to 'VIEW'. Included for symmetry / future reuse.
 *   - orderId: Optional — used only for logging context.
 * @returns {Promise<void>}
 *
 * @throws {AppError} - If the user lacks permission to view the given category.
 */
const verifyOrderViewPermission = async (user, category, { action = 'VIEW', orderId } = {}) => {
  // Normalize category defensively
  const cat = String(category || '').trim().toLowerCase();
  
  const { isRoot, accessibleCategories } =
    await resolveOrderAccessContext(user, { action });
  
  // Root users bypass checks
  if (isRoot) return;
  
  if (!accessibleCategories.includes(cat)) {
    logSystemWarn('Permission denied for viewing order details', {
      context: 'verifyOrderViewPermission',
      role: user?.role,
      userId: user?.id,
      orderId,
      attemptedCategory: cat,
      accessibleCategories,
      action,
    });
    
    throw AppError.authorizationError(
      `You do not have permission to ${action.toLowerCase()} ${cat} orders.`
    );
  }
};

/**
 * Evaluate whether a user can view order-level and order-item metadata in lookups.
 *
 * Checks:
 * - `VIEW_ORDER_METADATA` (header-level/order-level metadata)
 * - `VIEW_ORDER_ITEM_METADATA` (line-level metadata)
 * Root users automatically have access.
 *
 * @async
 * @param {Object} user - Authenticated user object with a permission set
 * @returns {Promise<{ canViewOrderMetadata: boolean, canViewOrderItemMetadata: boolean }>}
 */
// todo: evaluateOrderDetailsViewAccessControl
const evaluateOrderAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewOrderMetadata =
      isRoot || permissions.includes(PERMISSIONS.VIEW_SALES_ORDER_METADATA);
    
    const canViewOrderItemMetadata =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ORDER_ITEM_METADATA);
    
    return {
      canViewOrderMetadata,
      canViewOrderItemMetadata,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate order lookup access control', {
      context: 'order-business/evaluateOrderAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to evaluate user access control for order lookup', {
      details: err.message,
      stage: 'evaluate-order-access',
    });
  }
};

/**
 * Maps each order category to its valid status progression structure.
 *
 * Used for validating status transitions via `validateStatusTransitionByCategory`.
 */
const STATUS_CODES_BY_CATEGORY = {
  sales: {
    draft: ['ORDER_PENDING', 'ORDER_EDITED'],
    confirmation: ['ORDER_AWAITING_REVIEW', 'ORDER_CONFIRMED'],
    processing: ['ORDER_ALLOCATING', 'ORDER_PARTIALLY_ALLOCATED', 'ORDER_ALLOCATED'],
    return: ['RETURN_REQUESTED', 'RETURN_COMPLETED'],
    completion: ['ORDER_COMPLETED', 'ORDER_CANCELED'],
  },
};

/**
 * Validates whether a status transition is allowed based on category-specific flow.
 *
 * Rules:
 * - Allows forward transitions within the same category (based on defined sequence).
 * - Allows transitions to a new category (as long as it's listed for that order type).
 *
 * @param {string} orderCategory - The high-level order category (e.g., 'sales').
 * @param {string} currentCategory - Current status category (e.g., 'draft').
 * @param {string} nextCategory - Next status category to transition to.
 * @param {string} currentCode - Current status code (e.g., 'ORDER_PENDING').
 * @param {string} nextCode - Next status code to transition to (e.g., 'ORDER_CONFIRMED').
 *
 * @throws {AppError} If the transition is invalid.
 */
const validateStatusTransitionByCategory = (
  orderCategory,
  currentCategory,
  nextCategory,
  currentCode,
  nextCode
) => {
  const sequence = STATUS_CODES_BY_CATEGORY[orderCategory]?.[currentCategory] || [];
  
  const isSameCategory = currentCategory === nextCategory;
  
  const isForwardWithinSameCategory =
    isSameCategory &&
    sequence.includes(currentCode) &&
    sequence.includes(nextCode) &&
    sequence.indexOf(nextCode) > sequence.indexOf(currentCode);
  
  const allowedNextCategories = Object.keys(STATUS_CODES_BY_CATEGORY[orderCategory] || {});
  
  const isForwardToNextCategory =
    allowedNextCategories.includes(nextCategory) &&
    currentCategory !== nextCategory;
  
  if (!isForwardWithinSameCategory && !isForwardToNextCategory) {
    throw AppError.validationError(
      `Invalid transition for ${orderCategory}: ${currentCode} (${currentCategory}) → ${nextCode} (${nextCategory})`
    );
  }
};

/**
 * Determines whether the given user is authorized to update the order's status.
 *
 * This function enforces:
 *  - Role-based permission checks (RBAC)
 *  - Category-based access (e.g., sales vs. purchase)
 *  - Lock overrides for financially locked orders
 *
 * Throws:
 *  - Business error if attempting restricted transitions (e.g., canceling a paid order without override)
 *  - Validation error if next status is unknown
 *
 * @param {object} user - Authenticated user object (must include `id` and `role`)
 * @param {string} category - Order category (e.g., 'sales')
 * @param {object} order - Current order object with status, type, and ID
 * @param {string} nextStatusCode - Status code to transition to
 * @returns {Promise<boolean>} - True if the user is allowed to update the status
 */
const canUpdateOrderStatus = async (user, category, order, nextStatusCode) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    if (isRoot) return true;
    
    // 1. Map target status → required permission
    const transitionToPermissionMap = {
      ORDER_AWAITING_REVIEW: PERMISSIONS.CONFIRM_AWAITING_REVIEW_SALES_ORDER,
      ORDER_CONFIRMED: PERMISSIONS.CONFIRM_SALES_ORDER,
      ORDER_CANCELED: PERMISSIONS.CANCEL_SALES_ORDER,
      ORDER_SHIPPED: PERMISSIONS.SHIP_SALES_ORDER,
      ORDER_COMPLETED: PERMISSIONS.COMPLETE_SALES_ORDER,
    };
    
    const requiredPermission = transitionToPermissionMap[nextStatusCode];
    if (!requiredPermission) {
      throw AppError.validationError(`Unknown status code: ${nextStatusCode}`);
    }
    
    // 2. Check RBAC + category access (strict mode = require both)
    const hasPermission = permissions.includes(requiredPermission);
    const hasRoleAccess = canUserPerformActionOnOrderType(user, category);
    const isStrictAuthorization = true; // Optional: make this configurable
    
    if (isStrictAuthorization ? !(hasPermission && hasRoleAccess) : !(hasPermission || hasRoleAccess)) {
      return false;
    }
    
    // 3. Handle financial lock override
    if (isFinanciallyLocked(order) && nextStatusCode === 'ORDER_CANCELED') {
      if (!permissions.includes(PERMISSIONS.OVERRIDE_LOCKED_STATUS)) {
        throw AppError.businessError(
          'Cannot cancel a shipped or paid order unless override permission is granted.'
        );
      }
    }
    
    return true;
  } catch (err) {
    logSystemException(err, {
      message: 'Failed to evaluate order status update permission',
      context: 'order-business/canUpdateOrderStatus',
      userId: user?.id,
      orderId: order.order_id,
      nextStatusCode,
    });
    throw AppError.businessError('Unable to evaluate order status update permission', {
      details: err.message,
    });
  }
};

/**
 * Defines role-based permissions for various order type categories and actions.
 *
 * This structure maps each order type category (e.g., 'sales', 'transfer') to allowed roles
 * for specific actions (e.g., 'updateStatus').
 *
 * Example Usage:
 *   ORDER_TYPE_PERMISSIONS['sales']['updateStatus'] → ['sales', 'manager', 'admin']
 *
 * Used by: `canUserPerformActionOnOrderType(user, orderTypeCategory, action)`
 *
 * Add or uncomment entries as needed for more order types and actions.
 */
const ORDER_TYPE_PERMISSIONS = {
  sales: {
    updateStatus: ['sales', 'manager', 'admin'],
  },
  // transfer: {
  //   updateStatus: ['outbound_user', 'admin'],
  // },
  // logistics: {
  //   updateStatus: ['outbound_user', 'admin'],
  // },
  // sample: {
  //   updateStatus: ['admin'],
  // },
  // purchase: {
  //   updateStatus: ['admin'],
  // },
};

/**
 * Determines whether a user can perform a specific action on a given order type category.
 *
 * This is a role-based access control (RBAC) check based on `roleName` and order category.
 *
 * @param {object} user - Authenticated user (must include `roleName`, `isRoot`)
 * @param {string} orderTypeCategory - The category of the order type (e.g., 'sales', 'transfer')
 * @param {string} [action='updateStatus'] - The specific action to evaluate permission for
 * @returns {boolean} True if the user is allowed to perform the action
 */
const canUserPerformActionOnOrderType = (user, orderTypeCategory, action = 'updateStatus') => {
  if (user.isRoot) return true;
  
  const roleName = user.roleName;
  const allowedRoles = ORDER_TYPE_PERMISSIONS[orderTypeCategory]?.[action] || [];
  
  return allowedRoles.includes(roleName);
};

/**
 * Checks whether an order is financially locked based on its status or payment state.
 *
 * Orders that are shipped, fulfilled, delivered, or already paid are considered locked.
 *
 * @param {object} orderMetadata - Order object with at least `order_status_code` and `payment_status`
 * @returns {boolean} True if the order is financially locked
 */
const isFinanciallyLocked = (orderMetadata) => {
  const lockedOrderStatuses = [
    'ORDER_SHIPPED',
    'ORDER_OUT_FOR_DELIVERY',
    'ORDER_FULFILLED',
    'ORDER_DELIVERED'
  ];
  
  const lockedPaymentStatuses = [
    'PAID',
    'PARTIALLY_PAID',
    'OVERPAID',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
  ];
  
  return (
    lockedOrderStatuses.includes(orderMetadata.order_status_code) ||
    lockedPaymentStatuses.includes(orderMetadata.payment_status)
  );
};

/**
 * Enriches the updated order and item records with status metadata.
 *
 * This function attaches human-readable status fields (name, code, category)
 * to both the updated order object and its associated items using the
 * resolved `orderStatusMetadata` fetched earlier from the database.
 *
 * @param {Object} params - Function input parameters.
 * @param {Object} params.updatedOrder - The updated order object after status change.
 * @param {Array<Object>} params.updatedItems - List of updated order items.
 * @param {Object} params.orderStatusMetadata - Metadata about the new status.
 *
 * @returns {Promise<{
 *   enrichedOrder: Object,
 *   enrichedItems: Array<Object>
 * }>} Enriched order and item records with status metadata fields.
 */
const enrichStatusMetadata = ({ updatedOrder, updatedItems, orderStatusMetadata }) => {
  const { name, code, category } = orderStatusMetadata;
  
  const enrichedOrder = {
    ...updatedOrder,
    status_name: name,
    status_code: code,
    status_category: category,
  };
  
  const enrichedItems = updatedItems.map((item) => ({
    ...item,
    status_name: name,
    status_code: code,
    status_category: category,
  }));
  
  return {
    enrichedOrder,
    enrichedItems,
  };
};

/**
 * Validates a list of orders by their order numbers.
 *
 * @param {Array} orders - The list of transformed orders to validate.
 * @param {boolean} verifyOrderNumbers - Whether to verify order numbers.
 * @returns {Array} - Orders with `order_number_valid` property included.
 */
const validateOrderNumbers = (orders, verifyOrderNumbers = true) => {
  if (!Array.isArray(orders)) return [];

  return orders.map((order) => {
    let isOrderNumberValid = true;

    if (verifyOrderNumbers) {
      isOrderNumberValid = verifyOrderNumber(order.order_number);

      if (!isOrderNumberValid) {
        logError(`Invalid order number detected: ${order.order_number}`);
      }
    }

    return {
      ...order,
      order_number_valid: isOrderNumberValid,
    };
  });
};

/**
 * Applies business logic to the transformed order data.
 * @param {object} order - The transformed order object.
 * @param {object} user - The user object containing permissions.
 * @returns {object} - Order object with applied business logic.
 */
const applyOrderDetailsBusinessLogic = async (order, user) => {
  // Check if the order number is valid
  const isOrderNumberValid = verifyOrderNumber(order.order_number);

  if (!isOrderNumberValid) {
    // Check if the user has permission to view invalid orders
    const canViewInvalidOrder = await checkPermissions(user, [
      'view_full_sales_order_details',
      'view_all_order_details',
    ]);

    if (!canViewInvalidOrder) {
      throw AppError.validationError('Order number is invalid or not found.');
    }
  }

  // Format the discount and remove the original discount_type and discount_value
  order.discount = formatDiscount(order.discount_type, order.discount_value);
  delete order.discount_type;
  delete order.discount_value;

  // Process each item
  order.items = order.items.map((item) => {
    // Prepare the transformed item
    const transformedItem = {
      ...item,
      system_price: item.system_price,
    };

    // Remove adjusted_price if it's the same as system_price or null
    if (
      item.adjusted_price === null ||
      item.adjusted_price === item.system_price
    ) {
      delete transformedItem.adjusted_price;
    } else {
      transformedItem.adjusted_price = item.adjusted_price;
    }

    return transformedItem;
  });

  // Check if the user has permission to view metadata and category
  const canViewMetadata = checkPermissions(user, [
    'view_all_order_details',
    'view_full_sales_order_details',
  ]);

  // Remove sensitive data if the user lacks permission
  if (!canViewMetadata) {
    delete order.order_category;
    delete order.order_metadata;
  }

  return order;
};

/**
 * Business logic to confirm an order and its items.
 *
 * @param {string} orderId - The UUID of the order to confirm.
 * @param {object} user - an Authenticated user object (must contain a role).
 * @param {object} client - Optional PostgreSQL client (for transaction support).
 * @returns {Promise<Object>} Raw confirmation result.
 */
const confirmOrderWithItems = async (orderId, user, client) => {
  const hasPermission = await checkPermissions(user, [
    'confirm_order',
    'confirm_sales_order',
  ]);

  if (!hasPermission) {
    throw AppError.authorizationError(
      'You do not have permission to confirm orders.'
    );
  }

  return await updateOrderAndItemStatus(
    {
      orderId,
      orderStatusCode: 'ORDER_CONFIRMED',
      itemStatusCode: 'ORDER_CONFIRMED',
      userId: user.id,
    },
    client
  );
};

/**
 * Determines whether an order can be confirmed by validating both
 * the current order status and all associated order item statuses.
 *
 * Confirmation is allowed only if:
 * - The order's status code is in the allowed list (e.g., 'ORDER_PENDING')
 * - All order items also have a status that permits confirmation
 *
 * @param {string} orderId - UUID of the order to check
 * @param {object} client - Optional database client for transaction context
 * @returns {Promise<boolean>} - Whether the order is eligible for confirmation
 * @throws {AppError} - If the order status cannot be retrieved
 */
const canConfirmOrder = async (orderId, client) => {
  const allowedStatusCodes = ['ORDER_PENDING', 'ORDER_EDITED'];
  const allowedItemStatuses = ['ORDER_PENDING', 'ORDER_EDITED'];

  const rawStatusRows = await getOrderAndItemStatusCodes(orderId, client);
  const { order_status_code, item_status_codes } =
    transformOrderStatusCodes(rawStatusRows);

  if (!order_status_code) {
    throw AppError.databaseError(
      `Order status not found for order ID: ${orderId}`
    );
  }

  const isOrderConfirmable = allowedStatusCodes.includes(order_status_code);
  const areAllItemsConfirmable = item_status_codes.every((status) =>
    allowedItemStatuses.includes(status)
  );

  return isOrderConfirmable && areAllItemsConfirmable;
};

module.exports = {
  verifyOrderCreationPermission,
  createOrderWithType,
  verifyOrderViewPermission,
  evaluateOrderAccessControl,
  validateStatusTransitionByCategory,
  canUpdateOrderStatus,
  enrichStatusMetadata,
  validateOrderNumbers,
  applyOrderDetailsBusinessLogic,
  confirmOrderWithItems,
  canConfirmOrder,
};
