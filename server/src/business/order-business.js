/**
 * @file order-business.js
 * @description Domain business logic for order creation, permission enforcement,
 * access control evaluation, filter application, status transition validation,
 * and status metadata enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
  resolveOrderAccessContext,
} = require('../services/permission-service');
const AppError = require('../utils/AppError');
const {
  logSystemWarn,
  logSystemException,
} = require('../utils/logging/system-logger');
const { createSalesOrder } = require('./sales-order-business');
const { PERMISSIONS } = require('../utils/constants/domain/order-constants');

const CONTEXT = 'order-business';

// ---------------------------------------------------------------------------
// Status code configuration
// ---------------------------------------------------------------------------

/**
 * Maps order categories to their status code groups.
 * Virtual categories (e.g. `allocatable`) are cross-cutting views that span
 * multiple real order categories and are not tied to a single order type.
 *
 * @type {Record<string, { _virtual?: boolean, [group: string]: string[] | boolean }>}
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
 * Maps order categories to their creation strategy functions.
 * Add new order types here as they are implemented.
 */
const orderCreationStrategies = {
  sales: createSalesOrder,
};

/**
 * Maps order type categories to role-based action permissions.
 */
const ORDER_TYPE_PERMISSIONS = {
  sales: {
    updateStatus: ['sales', 'manager', 'admin'],
  },
};

/**
 * Maps target status codes to the permission required to transition to them.
 */
const TRANSITION_PERMISSION_MAP = {
  ORDER_AWAITING_REVIEW: PERMISSIONS.CONFIRM_AWAITING_REVIEW_SALES_ORDER,
  ORDER_CONFIRMED: PERMISSIONS.CONFIRM_SALES_ORDER,
  ORDER_CANCELED: PERMISSIONS.CANCEL_SALES_ORDER,
  ORDER_SHIPPED: PERMISSIONS.SHIP_SALES_ORDER,
  ORDER_COMPLETED: PERMISSIONS.COMPLETE_SALES_ORDER,
};

/**
 * Status codes that indicate an order is financially locked.
 * Cancellation of locked orders requires an explicit override permission.
 */
const LOCKED_ORDER_STATUSES = [
  'ORDER_SHIPPED',
  'ORDER_OUT_FOR_DELIVERY',
  'ORDER_FULFILLED',
  'ORDER_DELIVERED',
];

const LOCKED_PAYMENT_STATUSES = [
  'PAID',
  'PARTIALLY_PAID',
  'OVERPAID',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Determines whether an order is financially locked based on its order and
 * payment status codes.
 *
 * @param {OrderMetadataRow} orderMetadata - Order record with `order_status_code` and optional `payment_status`.
 * @returns {boolean}
 */
const isFinanciallyLocked = (orderMetadata) =>
  LOCKED_ORDER_STATUSES.includes(orderMetadata.order_status_code) ||
  LOCKED_PAYMENT_STATUSES.includes(orderMetadata.payment_code ?? '');

/**
 * Determines whether a user's role permits them to perform an action on a
 * given order type category.
 *
 * Root users always return `true`.
 *
 * @param {{ isRoot: boolean, roleName: string }} resolvedContext - Resolved permission context.
 * @param {string} orderTypeCategory - Order category (e.g. `'sales'`).
 * @param {string} [action='updateStatus'] - Action to check.
 * @returns {boolean}
 */
const canUserPerformActionOnOrderType = (
  resolvedContext,
  orderTypeCategory,
  action = 'updateStatus'
) => {
  if (resolvedContext.isRoot) return true;

  const allowedRoles =
    ORDER_TYPE_PERMISSIONS[orderTypeCategory]?.[action] || [];

  return allowedRoles.includes(resolvedContext.roleName);
};

// ---------------------------------------------------------------------------
// Exported business functions
// ---------------------------------------------------------------------------

/**
 * Verifies that the requesting user has permission to create an order of the
 * given category.
 *
 * Root users bypass all checks. Non-root users must have the category in their
 * accessible categories for the given action.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {string} category - Order category being created (e.g. `'sales'`).
 * @param {object} [options={}]
 * @param {string} [options.action='CREATE'] - Action context for permission resolution.
 * @returns {Promise<void>}
 * @throws {AppError} authorizationError if the user lacks permission.
 */
const verifyOrderCreationPermission = async (
  user,
  category,
  { action = 'CREATE' } = {}
) => {
  const context = `${CONTEXT}/verifyOrderCreationPermission`;

  const { isRoot, accessibleCategories } = await resolveOrderAccessContext(
    user,
    { action }
  );

  if (isRoot) return;

  if (!accessibleCategories.includes(category)) {
    logSystemWarn('Permission denied for order creation', {
      context,
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
 * Creates an order using the strategy registered for the given category.
 *
 * @param {string} category - Order category (e.g. `'sales'`).
 * @param {object} orderData - Order creation payload.
 * @param {import('pg').PoolClient} client - Active transaction client.
 * @returns {Promise<object>} Created order record.
 * @throws {AppError} validationError if the category has no registered strategy.
 */
const createOrderWithType = async (category, orderData, client) => {
  const hasStrategy = Object.prototype.hasOwnProperty.call(
    orderCreationStrategies,
    category
  );
  const createFn = hasStrategy ? orderCreationStrategies[category] : null;

  if (typeof createFn !== 'function') {
    throw AppError.validationError(`Unsupported order category: ${category}`);
  }

  return createFn(orderData, client);
};

/**
 * Verifies that the requesting user has permission to view orders of the
 * given category.
 *
 * Root users bypass all checks. Category is normalized to lowercase before
 * comparison.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {string} category - Order category being viewed.
 * @param {object} [options={}]
 * @param {string} [options.action='VIEW'] - Action context for permission resolution.
 * @param {string} [options.orderId] - Order UUID for audit logging.
 * @returns {Promise<void>}
 * @throws {AppError} authorizationError if the user lacks permission.
 */
const verifyOrderViewPermission = async (
  user,
  category,
  { action = 'VIEW', orderId } = {}
) => {
  const context = `${CONTEXT}/verifyOrderViewPermission`;

  const cat = String(category || '')
    .trim()
    .toLowerCase();

  const { isRoot, accessibleCategories } = await resolveOrderAccessContext(
    user,
    { action }
  );

  if (isRoot) return;

  if (!accessibleCategories.includes(cat)) {
    logSystemWarn('Permission denied for viewing orders in this category.', {
      context,
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
 * Resolves which order list viewing capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<OrdersViewAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateOrdersViewAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateOrdersViewAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewAllOrders:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_ORDERS),
      canViewAllocationStage:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALLOCATION_STAGE),
      canViewFulfillmentStage:
        isRoot || permissions.includes(PERMISSIONS.VIEW_FULFILLMENT_STAGE),
      canViewShippingStage:
        isRoot || permissions.includes(PERMISSIONS.VIEW_SHIPPING_STAGE),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate order view access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate order view access control.'
    );
  }
};

/**
 * Applies ACL-driven access filters to an order list filter object.
 *
 * Five cases handled:
 * - Full access with no category filter → remove all access-based filters.
 * - Full access with category filter → retain scoped filters.
 * - Category-level access → restrict by `orderTypeId`.
 * - Stage-level access → restrict by `orderStatusIds`.
 * - No access → inject sentinel value to force empty result.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {OrdersViewAcl} userAccess - Resolved ACL from `evaluateOrdersViewAccessControl`.
 * @param {string[]} orderTypeIds - Permitted order type IDs for the user.
 * @param {string[]} allowedStatusIds - Permitted order status IDs for stage access.
 * @returns {object} Adjusted copy of `filters` with access rules applied.
 */
const applyOrderAccessFilters = (
  filters,
  userAccess,
  orderTypeIds,
  allowedStatusIds
) => {
  const modifiedFilters = { ...filters };

  const hasStageAccess =
    userAccess?.canViewAllocationStage ||
    userAccess?.canViewFulfillmentStage ||
    userAccess?.canViewShippingStage;

  if (userAccess?.canViewAllOrders) {
    if (!filters?.orderCategory) {
      // Pure global view — remove all access-based filters.
      delete modifiedFilters.orderTypeId;
      delete modifiedFilters.orderStatusIds;
    }
    return modifiedFilters;
  }

  const hasOrderTypeAccess =
    Array.isArray(orderTypeIds) && orderTypeIds.length > 0;

  if (hasOrderTypeAccess) {
    modifiedFilters.orderTypeId = orderTypeIds;
  } else {
    delete modifiedFilters.orderTypeId;
  }

  if (hasStageAccess) {
    if (Array.isArray(allowedStatusIds) && allowedStatusIds.length > 0) {
      modifiedFilters.orderStatusIds = allowedStatusIds;
    }
  }

  // Category access without stage access — restrict by orderTypeId only.
  if (!hasStageAccess && hasOrderTypeAccess) {
    delete modifiedFilters.orderStatusIds;
    return modifiedFilters;
  }

  // No access at all — force empty result.
  if (!hasStageAccess && !hasOrderTypeAccess) {
    return {
      ...modifiedFilters,
      orderStatusIds: ['__NO_ACCESS__'],
    };
  }

  return modifiedFilters;
};

/**
 * Resolves which order detail viewing capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<OrderDetailsViewAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateOrderDetailsViewAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateOrderDetailsViewAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewOrderMetadata:
        isRoot || permissions.includes(PERMISSIONS.VIEW_SALES_ORDER_METADATA),
      canViewOrderItemMetadata:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ORDER_ITEM_METADATA),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate order details view access control',
      {
        context,
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for order details.'
    );
  }
};

/**
 * Returns a flat list of `{ code, category }` pairs for the allowed statuses
 * of a given order category.
 *
 * When `orderCategory` is provided, returns statuses from that category's
 * non-virtual status groups. When omitted or `'all'`, returns statuses from
 * virtual categories only (e.g. `allocatable`).
 *
 * @param {string} [orderCategory] - Order category to resolve statuses for.
 * @returns {Array<{ code: string, category: string }>}
 */
const getNextAllowedStatuses = (orderCategory) => {
  const relevantCategories =
    orderCategory && orderCategory !== 'all'
      ? [orderCategory]
      : Object.keys(STATUS_CODES_BY_CATEGORY);

  const allowedStatuses = [];

  for (const categoryKey of relevantCategories) {
    const categoryMap = STATUS_CODES_BY_CATEGORY[categoryKey];
    if (!categoryMap) continue;

    // When a specific category is requested, skip virtual categories.
    if (
      orderCategory &&
      orderCategory !== 'all' &&
      categoryMap._virtual === true
    )
      continue;

    // When no category is provided, only include virtual categories.
    if (!orderCategory && categoryMap._virtual !== true) continue;

    for (const [statusCategory, codes] of Object.entries(categoryMap)) {
      if (statusCategory === '_virtual') continue;

      allowedStatuses.push(
        ...codes.map((code) => ({ code, category: statusCategory }))
      );
    }
  }

  return allowedStatuses;
};

/**
 * Validates that a status transition is permitted within the given order category.
 *
 * A transition is valid if it moves forward within the same status group, or
 * forward to a different status group within the category.
 *
 * @param {string} orderCategory - Order category (e.g. `'sales'`).
 * @param {string} currentCategory - Current status group (e.g. `'draft'`).
 * @param {string} nextCategory - Target status group.
 * @param {string} currentCode - Current status code.
 * @param {string} nextCode - Target status code.
 * @returns {void}
 * @throws {AppError} validationError if the transition is not permitted.
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
 * Evaluates whether the requesting user can update an order to the given
 * status code.
 *
 * Enforces both RBAC (role-based) and permission-based checks in strict mode
 * (both must pass). Also enforces financial lock override for cancellations
 * of locked orders.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {string} category - Order category (e.g. `'sales'`).
 * @param {OrderMetadataRow} orderWithMeta - Current order record with status and payment metadata.
 * @param {string} nextStatusCode - Target status code.
 * @returns {Promise<boolean>} `true` if permitted, `false` if not.
 * @throws {AppError} validationError if the status code is unknown.
 * @throws {AppError} businessError if cancellation of a locked order is attempted
 *   without override permission.
 */
const canUpdateOrderStatus = async (
  user,
  category,
  orderWithMeta,
  nextStatusCode
) => {
  const resolved = await resolveUserPermissionContext(user);
  const { permissions, isRoot } = resolved;

  if (isRoot) return true;

  const requiredPermission = TRANSITION_PERMISSION_MAP[nextStatusCode];

  if (!requiredPermission) {
    throw AppError.validationError(`Unknown status code: ${nextStatusCode}`);
  }

  const hasPermission = permissions.includes(requiredPermission);
  const hasRoleAccess = canUserPerformActionOnOrderType(resolved, category);

  // Strict mode — both RBAC and permission check must pass.
  if (!(hasPermission && hasRoleAccess)) {
    return false;
  }

  if (
    isFinanciallyLocked(orderWithMeta) &&
    nextStatusCode === 'ORDER_CANCELED'
  ) {
    if (!permissions.includes(PERMISSIONS.OVERRIDE_LOCKED_STATUS)) {
      throw AppError.businessError(
        'Cannot cancel a shipped or paid order unless override permission is granted.'
      );
    }
  }

  return true;
};

/**
 * Enriches updated order and item records with resolved status metadata fields.
 *
 * @param {object} options
 * @param {object} options.updatedOrder - Updated order record.
 * @param {object[]} options.updatedItems - Updated order item records.
 * @param {{ name: string, code: string, category: string }} options.orderStatusMetadata
 * @returns {{ enrichedOrder: object, enrichedItems: object[] }}
 */
const enrichStatusMetadata = ({
  updatedOrder,
  updatedItems,
  orderStatusMetadata,
}) => {
  const { name, code, category } = orderStatusMetadata;

  return {
    enrichedOrder: {
      ...updatedOrder,
      status_name: name,
      status_code: code,
      status_category: category,
    },
    enrichedItems: updatedItems.map((item) => ({
      ...item,
      status_name: name,
      status_code: code,
      status_category: category,
    })),
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
