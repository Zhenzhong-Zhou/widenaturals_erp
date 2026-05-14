/**
 * @file order-type-business.js
 * @description Domain business logic for order type access control evaluation,
 * visibility rule application, filter enforcement, row-level field filtering,
 * and row enrichment.
 */

'use strict';

const {
  checkPermissions,
  resolveOrderAccessContext,
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/order-type-constants');

const CONTEXT = 'order-type-business';

/**
 * Checks whether the requesting user can view order type codes.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<boolean>}
 */
const canViewOrderTypeCode = async (user) =>
  checkPermissions(user, ['view_order_type_code']);

/**
 * Enforces that the requesting user is not filtering or sorting by `code`
 * when they lack permission to view order type codes.
 *
 * @param {object} options
 * @param {AuthUser} options.user - Authenticated user making the request.
 * @param {object} options.filters - Request filters.
 * @param {string} [options.sortBy] - Requested sort field.
 * @returns {Promise<void>}
 * @throws {AppError} authorizationError if the user filters or sorts by `code` without permission.
 */
const enforceOrderTypeCodeAccessControl = async ({ user, filters, sortBy }) => {
  const canViewCode = await canViewOrderTypeCode(user);

  if (!canViewCode) {
    if ('code' in filters) {
      throw AppError.authorizationError('Filtering by code is not allowed.');
    }

    if (sortBy === 'code') {
      throw AppError.authorizationError('Sorting by code is not allowed.');
    }
  }
};

/**
 * Strips the `code` field from each row in a paginated result when the
 * requesting user lacks permission to view order type codes.
 *
 * @param {object} result - Paginated result object with a `data` array.
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<object>} Result with `code` removed from rows if unpermitted.
 */
const filterOrderTypeRowsByPermission = async (result, user) => {
  const canViewCode = await canViewOrderTypeCode(user);

  if (!result?.data || !Array.isArray(result.data)) return result;

  return {
    ...result,
    data: result.data.map((row) => {
      if (!canViewCode) {
        const { code, ...rest } = row;
        return rest;
      }
      return row;
    }),
  };
};

/**
 * Resolves which order type lookup visibility capabilities the requesting
 * user holds, including accessible order categories.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {object} [options={}]
 * @param {string} [options.action='VIEW'] - Action context for category resolution.
 * @returns {Promise<OrderTypeLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateOrderTypeLookupAccessControl = async (
  user,
  { action = 'VIEW' } = {}
) => {
  const context = `${CONTEXT}/evaluateOrderTypeLookupAccessControl`;

  try {
    const { isRoot, permissions } = await resolveUserPermissionContext(user);
    const { accessibleCategories } = await resolveOrderAccessContext(user, {
      action,
    });

    return {
      canViewAllCategories:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ORDER_TYPE_CODE),
      canViewAllStatuses:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_ALL_ORDER_TYPE_STATUSES),
      canViewAllKeywords:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ORDER_TYPE),
      accessibleCategories: accessibleCategories ?? [],
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate order type lookup access control',
      { context, userId: user?.id }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for order type lookup.'
    );
  }
};

/**
 * Applies ACL-driven and context-driven visibility rules to an order type lookup filter object.
 *
 * Rules applied:
 * - Category scope:
 *   - If `options.categoryScope` is provided, it is treated as the business-context scope
 *     for the lookup, such as `sales` for the Sales Order form.
 *   - Otherwise, `filters.category` is treated as the requested category scope.
 *   - If the user lacks full category access, the requested category is validated against
 *     `access.accessibleCategories` instead of being overwritten by all accessible categories.
 *   - If no category is requested and the user lacks full category access, the lookup is
 *     restricted to `access.accessibleCategories`.
 * - Keyword restriction:
 *   - Injects `_restrictKeywordToValidOnly` when keyword searching is requested by a user
 *     who cannot search all order type keywords.
 * - Status restriction:
 *   - Removes client-provided `statusId` and pins the lookup to `_activeStatusId` for users
 *     who cannot view all order type statuses.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {OrderTypeLookupAcl} access - Resolved ACL from `evaluateOrderTypeLookupAccessControl`.
 * @param {object} [options={}] - Additional service-level visibility options.
 * @param {string} [options.activeStatusId] - UUID of the active order type status record.
 * @param {string|string[]} [options.categoryScope] - Business-context category scope forced by the caller.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 * @throws {AppError} authorizationError if the user has no accessible categories or cannot access the requested category.
 */
const enforceOrderTypeLookupVisibilityRules = (
  filters = {},
  access,
  options = {}
) => {
  const adjusted = { ...filters };
  
  const requestedCategory = options.categoryScope ?? filters.category;
  
  if (requestedCategory) {
    const requestedCategories = Array.isArray(requestedCategory)
      ? requestedCategory
      : [requestedCategory];
    
    if (!access.canViewAllCategories) {
      const allowedCategories = requestedCategories.filter((category) =>
        access.accessibleCategories?.includes(category)
      );
      
      if (allowedCategories.length === 0) {
        throw AppError.authorizationError(
          'User is not authorized to view the requested order category.'
        );
      }
      
      adjusted.category =
        allowedCategories.length === 1 ? allowedCategories[0] : allowedCategories;
    } else {
      adjusted.category =
        requestedCategories.length === 1
          ? requestedCategories[0]
          : requestedCategories;
    }
  } else if (!access.canViewAllCategories) {
    if (!access.accessibleCategories?.length) {
      throw AppError.authorizationError(
        'User is not authorized to view any order categories.'
      );
    }
    
    adjusted.category = access.accessibleCategories;
  }
  
  if (filters.keyword && !access.canViewAllKeywords) {
    adjusted._restrictKeywordToValidOnly = true;
  }
  
  if (!access.canViewAllStatuses) {
    delete adjusted.statusId;
    
    if (options.activeStatusId) {
      adjusted._activeStatusId = options.activeStatusId;
    }
  }
  
  return adjusted;
};

/**
 * Enriches an order type row with derived boolean flags.
 *
 * @param {object} row - Raw order type row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, requiresPayment: boolean }}
 */
const enrichOrderTypeRow = (row, activeStatusId) => {
  return {
    ...row,
    isActive: (row.status_id ?? null) === activeStatusId,
    requiresPayment: Boolean(row.requires_payment),
  };
};

module.exports = {
  canViewOrderTypeCode,
  enforceOrderTypeCodeAccessControl,
  filterOrderTypeRowsByPermission,
  evaluateOrderTypeLookupAccessControl,
  enforceOrderTypeLookupVisibilityRules,
  enrichOrderTypeRow,
};
