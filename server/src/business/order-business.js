const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
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
const verifyOrderCreationPermission = async (
  user,
  category,
  { action = 'CREATE' } = {}
) => {
  const { isRoot, accessibleCategories } = await resolveOrderAccessContext(
    user,
    { action }
  );

  if (isRoot) return;

  if (!accessibleCategories.includes(category)) {
    logSystemWarn('Permission denied for order creation', {
      context: 'order-business/verifyOrderCreationPermission',
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
const verifyOrderViewPermission = async (
  user,
  category,
  { action = 'VIEW', orderId } = {}
) => {
  // Normalize category defensively
  const cat = String(category || '')
    .trim()
    .toLowerCase();

  const { isRoot, accessibleCategories } = await resolveOrderAccessContext(
    user,
    { action }
  );

  // Root users bypass checks
  if (isRoot) return;

  if (!accessibleCategories.includes(cat)) {
    logSystemWarn('Permission denied for viewing orders in this category.', {
      context: 'order-business/verifyOrderViewPermission',
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
 * Evaluates whether the authenticated user is allowed to view all orders
 * or specific lifecycle stages (e.g., allocation, fulfillment, shipping).
 *
 * Behavior:
 * - Root users are always granted full access to all stages and categories.
 * - Users with `VIEW_ALL_ORDERS` are granted unrestricted order access.
 * - Users with stage-level permissions will be granted access to specific order stages
 *   (e.g., allocation, fulfillment, shipping) — useful for virtual views like "allocatable".
 * - All other users will be restricted by order type or category.
 *
 * This function does **not** return any actual order data. It simply resolves access flags
 * used to filter or scope data later in the business logic.
 *
 * @async
 * @param {Object} user - The authenticated user object (should include at least `id` and `role_id`)
 * @returns {Promise<{
 *   canViewAllOrders: boolean,
 *   canViewAllocationStage: boolean,
 *   canViewFulfillmentStage: boolean,
 *   canViewShippingStage: boolean
 * }>} - Object containing permission flags for view access
 *
 * @example
 * const {
 *   canViewAllOrders,
 *   canViewAllocationStage,
 *   canViewFulfillmentStage,
 *   canViewShippingStage
 * } = await evaluateOrdersViewAccessControl(user);
 *
 * if (canViewAllOrders) {
 *   // show all orders
 * } else if (canViewAllocationStage) {
 *   // show only allocation-stage orders
 * }
 */
const evaluateOrdersViewAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllOrders =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_ORDERS);
    const canViewAllocationStage =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALLOCATION_STAGE);
    const canViewFulfillmentStage =
      isRoot || permissions.includes(PERMISSIONS.VIEW_FULFILLMENT_STAGE);
    const canViewShippingStage =
      isRoot || permissions.includes(PERMISSIONS.VIEW_SHIPPING_STAGE);

    return {
      canViewAllOrders,
      canViewAllocationStage,
      canViewFulfillmentStage,
      canViewShippingStage,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate order view access control', {
      context: 'order-business/evaluateOrdersViewAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError('Unable to evaluate order view access', {
      details: err.message,
      stage: 'evaluate-order-access',
    });
  }
};

/**
 * Applies scoped access control filters to an order query based on the user's access rights.
 *
 * This function injects or removes `orderTypeId` and `orderStatusIds` fields in the provided
 * filter object, depending on whether the user has global view access, category-level access,
 * or stage-level access (e.g., allocation, fulfillment, or shipping).
 *
 * Behavior:
 * - If the user has **global access** (`canViewAllOrders`):
 *   - If no `orderCategory` filter is provided, all scoped filters (`orderTypeId`, `orderStatusIds`) are removed.
 *   - If `orderCategory` **is** provided, scoped filters are retained and respected.
 *
 * - If the user has **category-level access**, the `orderTypeId` filter is applied using resolved IDs.
 * - If the user has **stage-level access**, the `orderStatusIds` filter is applied using resolved status IDs.
 * - If the user has both category and stage access, both filters are applied together.
 *
 * - If the user has category access but **not** stage access, only `orderTypeId` is used and `orderStatusIds` is removed.
 * - If the user has neither category nor stage access, the query is forcibly denied using `orderStatusIds: ['__NO_ACCESS__']`.
 *
 * This ensures the resulting query filters accurately reflect the user's access scope and prevent unauthorized visibility.
 *
 * @async
 * @param {Object} filters - Original query filter object (e.g., keyword, dates, orderTypeId, orderStatusId, etc.)
 * @param {Object} userAccess - Result of `evaluateOrdersViewAccessControl`, including access flags like `canViewAllOrders`
 * @param {Array<string>|undefined} orderTypeIds - List of allowed order type UUIDs (based on category)
 * @param {Array<string>|undefined} allowedStatusIds - List of allowed order status UUIDs (based on stage access)
 * @returns {Promise<Object>} A new filters object with scoped access restrictions applied
 *
 * @example
 * const userAccess = await evaluateOrdersViewAccessControl(user);
 * const orderTypeIds = await getOrderTypeIdsByCategory('sales');
 * const allowedStatusIds = await getAllowedStageStatusIds(userAccess);
 * const filters = await applyOrderAccessFilters(originalFilters, userAccess, orderTypeIds, allowedStatusIds);
 */
const applyOrderAccessFilters = async (
  filters,
  userAccess,
  orderTypeIds,
  allowedStatusIds
) => {
  try {
    const modifiedFilters = { ...filters };

    // Determine if user has any stage-based access (allocation, fulfillment, shipping)
    const hasStageAccess =
      userAccess?.canViewAllocationStage ||
      userAccess?.canViewFulfillmentStage ||
      userAccess?.canViewShippingStage;

    // Case 1: User has full access to all orders
    // - If no `orderCategory` is present → clear access filters (true global view)
    // - If `orderCategory` is present → retain scoped filters from that category
    if (userAccess?.canViewAllOrders) {
      const hasOrderCategoryFilter = Boolean(filters?.orderCategory);

      if (!hasOrderCategoryFilter) {
        // Pure global view → remove all access-based filters
        delete modifiedFilters.orderTypeId;
        delete modifiedFilters.orderStatusIds;
      }

      // Otherwise: keep any filters applied due to orderCategory
      return modifiedFilters;
    }

    const hasOrderTypeAccess =
      Array.isArray(orderTypeIds) && orderTypeIds.length > 0;

    // Case 2: Category-level access — restrict by orderTypeId
    if (hasOrderTypeAccess) {
      modifiedFilters.orderTypeId = orderTypeIds;
    } else {
      delete modifiedFilters.orderTypeId;
    }

    // Case 3: Stage-level access — restrict by orderStatusIds (based on allowed statuses)
    if (hasStageAccess) {
      if (Array.isArray(allowedStatusIds) && allowedStatusIds.length > 0) {
        modifiedFilters.orderStatusIds = allowedStatusIds;
      }
    }

    // Case 4: Has category access but not stage — restrict by orderTypeId only
    if (!hasStageAccess && hasOrderTypeAccess) {
      delete modifiedFilters.orderStatusIds;
      return modifiedFilters;
    }

    // Case 5: No access → deny all results
    if (!hasStageAccess && !hasOrderTypeAccess) {
      return {
        ...modifiedFilters,
        orderStatusIds: ['__NO_ACCESS__'],
      };
    }

    return modifiedFilters;
  } catch (err) {
    logSystemException(
      err,
      'Failed to apply access filters in applyOrderAccessFilters',
      {
        context: 'order-business/applyOrderAccessFilters',
        originalFilters: filters,
        userAccess,
        orderTypeIds,
      }
    );

    throw AppError.businessError('Unable to apply order access filters', {
      details: err.message,
      stage: 'filter-order-access',
      cause: err,
    });
  }
};

/**
 * Evaluate whether a user can view order details (header-level and item-level metadata).
 *
 * This function checks whether the user has view access to:
 * - `VIEW_SALES_ORDER_METADATA` (header-level metadata)
 * - `VIEW_ORDER_ITEM_METADATA` (item-level metadata)
 *
 * Root users are automatically granted both permissions.
 *
 * @async
 * @param {Object} user - Authenticated user object with permissions context
 * @returns {Promise<{ canViewOrderMetadata: boolean, canViewOrderItemMetadata: boolean }>}
 */
const evaluateOrderDetailsViewAccessControl = async (user) => {
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
      context: 'order-business/evaluateOrderDetailsViewAccessControl',
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate user access control for order lookup',
      {
        details: err.message,
        stage: 'evaluate-order-access',
      }
    );
  }
};

/**
 * Maps each order category to its associated status progression structure.
 *
 * This object defines how orders progress through various lifecycle stages,
 * grouped by category. It supports validation, filtering, and business logic
 * that depends on category-specific status flows.
 *
 * Structure:
 * - Keys are order categories (e.g., 'sales', 'allocatable')
 * - Each category maps to an object grouping status codes by phase:
 *   - `draft`, `confirmation`, `processing`, `return`, `completion`, etc.
 * - Each phase maps to an array of status codes (as string identifiers)
 * - Categories may optionally include `_virtual: true` to indicate that they are
 *   synthetic or filtered (e.g., 'allocatable' is a virtual view, not a true type)
 *
 * Notes:
 * - Used by validation functions such as `validateStatusTransitionByCategory`
 * - Helps drive UI groupings, filtering, and access control based on lifecycle stage
 * - The `allocatable` category is virtual and represents orders in the allocation stage,
 *   regardless of their originating category
 *
 * Example:
 *   STATUS_CODES_BY_CATEGORY.sales.processing
 *   → ['ORDER_ALLOCATING', 'ORDER_PARTIALLY_ALLOCATED', 'ORDER_ALLOCATED']
 */
const STATUS_CODES_BY_CATEGORY = {
  sales: {
    draft: ['ORDER_PENDING', 'ORDER_EDITED'],
    confirmation: ['ORDER_AWAITING_REVIEW', 'ORDER_CONFIRMED'],
    processing: [
      'ORDER_ALLOCATING',
      'ORDER_PARTIALLY_ALLOCATED',
      'ORDER_ALLOCATED',
    ],
    return: ['RETURN_REQUESTED', 'RETURN_COMPLETED'],
    completion: ['ORDER_COMPLETED', 'ORDER_CANCELED'],
  },
  allocatable: {
    _virtual: true,
    confirmation: ['ORDER_CONFIRMED'],
    processing: [
      'ORDER_ALLOCATING',
      'ORDER_PARTIALLY_ALLOCATED',
      'ORDER_ALLOCATED',
    ],
  },
};

/**
 * Returns all allowed order status codes grouped by their logical phase (e.g., 'draft', 'processing'),
 * filtered by a specific order category if provided.
 *
 * This function is typically used for building filters, validating status transitions,
 * or generating dropdowns for order status selection within a category.
 *
 * Behavior:
 * - If a specific `orderCategory` is provided (e.g., `'sales'`, `'transfer'`), only statuses
 *   under that category will be evaluated — **but only if the category is marked as `_virtual: true`**.
 * - If `orderCategory` is `'all'` or falsy, the function returns statuses from **all virtual categories only**.
 * - Categories that are not marked as `_virtual: true` are excluded from the result entirely.
 *
 * The returned format is a flat array of objects with each status code and its corresponding status phase
 * (e.g., 'draft', 'processing', etc.).
 *
 * @param {string} [orderCategory] - The order category to filter by (e.g., `'sales'`). Pass `'all'` or falsy to include all virtual categories.
 * @returns {Array<{ code: string, category: string }>} - A flat list of `{ code, category }` pairs.
 *
 * @example
 * getNextAllowedStatuses('sales');
 * // → [
 * //     { code: 'ORDER_PENDING', category: 'draft' },
 * //     { code: 'ORDER_CONFIRMED', category: 'confirmation' },
 * //     ...
 * //   ]
 *
 * getNextAllowedStatuses();
 * // → Returns statuses from all `_virtual: true` categories.
 */
const getNextAllowedStatuses = (orderCategory) => {
  const relevantCategories =
    orderCategory && orderCategory !== 'all'
      ? [orderCategory]
      : Object.keys(STATUS_CODES_BY_CATEGORY);

  const allowedStatuses = [];

  for (const categoryKey of relevantCategories) {
    const categoryMap = STATUS_CODES_BY_CATEGORY[categoryKey];
    if (!categoryMap || categoryMap._virtual !== true) continue;

    for (const [statusCategory, codes] of Object.entries(categoryMap)) {
      if (statusCategory === '_virtual') continue;

      allowedStatuses.push(
        ...codes.map((code) => ({
          code,
          category: statusCategory,
        }))
      );
    }
  }

  return allowedStatuses;
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
  const sequence =
    STATUS_CODES_BY_CATEGORY[orderCategory]?.[currentCategory] || [];

  const isSameCategory = currentCategory === nextCategory;

  const isForwardWithinSameCategory =
    isSameCategory &&
    sequence.includes(currentCode) &&
    sequence.includes(nextCode) &&
    sequence.indexOf(nextCode) > sequence.indexOf(currentCode);

  const allowedNextCategories = Object.keys(
    STATUS_CODES_BY_CATEGORY[orderCategory] || {}
  );

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

    if (
      isStrictAuthorization
        ? !(hasPermission && hasRoleAccess)
        : !(hasPermission || hasRoleAccess)
    ) {
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
    throw AppError.businessError(
      'Unable to evaluate order status update permission',
      {
        details: err.message,
      }
    );
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
const canUserPerformActionOnOrderType = (
  user,
  orderTypeCategory,
  action = 'updateStatus'
) => {
  if (user.isRoot) return true;

  const roleName = user.roleName;
  const allowedRoles =
    ORDER_TYPE_PERMISSIONS[orderTypeCategory]?.[action] || [];

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
    'ORDER_DELIVERED',
  ];

  const lockedPaymentStatuses = [
    'PAID',
    'PARTIALLY_PAID',
    'OVERPAID',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
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
const enrichStatusMetadata = ({
  updatedOrder,
  updatedItems,
  orderStatusMetadata,
}) => {
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

module.exports = {
  verifyOrderCreationPermission,
  createOrderWithType,
  verifyOrderViewPermission,
  evaluateOrdersViewAccessControl,
  applyOrderAccessFilters,
  evaluateOrderDetailsViewAccessControl,
  getNextAllowedStatuses,
  validateStatusTransitionByCategory,
  canUpdateOrderStatus,
  enrichStatusMetadata,
};
