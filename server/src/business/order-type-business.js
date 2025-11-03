const {
  checkPermissions,
  resolveOrderAccessContext,
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  logSystemException,
  logSystemError,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/order-type-constants');

/**
 * Determines if the user has permission to access the internal `code` field for order types.
 * This includes permission to filter by, sort by, or display the `code` field.
 *
 * @param {Object} user - The authenticated user object.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the user has access, otherwise `false`.
 */
const canViewOrderTypeCode = async (user) => {
  return await checkPermissions(user, ['view_order_type_code']);
};

/**
 * Enforces access control on filtering and sorting by `code` in order types.
 *
 * - Throws an authorization error if the user is not allowed to use `code`
 *   as a filter or sort field.
 *
 * @param {Object} params
 * @param {Object} params.user - Authenticated user
 * @param {Object} params.filters - Query filters (e.g., { keyword, code })
 * @param {string} [params.sortBy] - Sort field
 * @returns {Promise<void>} Throws if access is unauthorized
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
 * Filters raw order type rows based on the user's permissions.
 *
 * Behavior:
 * - If the user does **not** have permission to view order type codes,
 *   the `code` field will be removed from each row.
 * - If the user **can** view codes, rows are returned unchanged.
 *
 * @param {Object} result - Raw query result object (must include `data: Array<Object>`)
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Result object with filtered `data` array
 *
 * @example
 * const filtered = await filterOrderTypeRowsByPermission(result, user);
 */
const filterOrderTypeRowsByPermission = async (result, user) => {
  const canViewCode = await canViewOrderTypeCode(user);

  if (!result?.data || !Array.isArray(result.data)) return result;

  const filteredData = result.data.map((row) => {
    if (!canViewCode) {
      const { code, ...rest } = row;
      return rest;
    }
    return row;
  });

  return {
    ...result,
    data: filteredData,
  };
};

/**
 * Evaluates access control flags for the order type lookup feature based on the
 * authenticated user's role, permissions, and assigned categories.
 *
 * This function determines whether the user can view all categories, statuses,
 * and keywords when searching or listing order types. It supports both role-based
 * (RBAC) and category-based access control.
 *
 * Behavior:
 *   - Root users automatically receive unrestricted access to all categories, statuses, and keywords.
 *   - Non-root users must have explicit permissions to unlock each capability.
 *   - Category access is further scoped by `resolveOrderAccessContext`, which may limit results.
 *
 * @async
 * @param {object} user - Authenticated user object (must include `id` and `role`).
 * @param {object} [options] - Optional configuration.
 * @param {'VIEW'|'CREATE'|'UPDATE'|'DELETE'} [options.action='VIEW'] - Permission action to evaluate.
 * @returns {Promise<{
 *   canViewAllCategories: boolean, // True if user can view order types for all categories (not just assigned)
 *   canViewAllStatuses: boolean,   // True if user can view all statuses (not only active)
 *   canViewAllKeywords: boolean,   // True if user can search unrestricted keywords (code/name/description)
 *   accessibleCategories: string[] // List of category codes the user has access to (empty if none)
 * }>}
 *
 * @throws {AppError}
 *   - `businessError` if evaluation fails due to invalid user data or downstream service failure.
 *
 * @example
 * const access = await evaluateOrderTypeLookupAccessControl(currentUser, { action: 'VIEW' });
 * if (access.canViewAllCategories) {
 *   // show all categories in the dropdown
 * }
 */
const evaluateOrderTypeLookupAccessControl = async (
  user,
  { action = 'VIEW' } = {}
) => {
  try {
    const { isRoot, permissions } = await resolveUserPermissionContext(user);
    const { accessibleCategories } = await resolveOrderAccessContext(user, {
      action,
    });

    const has = (perm) => isRoot || permissions.includes(perm);

    const canViewAllCategories = has(PERMISSIONS.VIEW_ORDER_TYPE_CODE);
    const canViewAllStatuses = has(PERMISSIONS.VIEW_ALL_ORDER_TYPE_STATUSES);
    const canViewAllKeywords = has(PERMISSIONS.VIEW_ORDER_TYPE);

    return {
      canViewAllCategories,
      canViewAllStatuses,
      canViewAllKeywords,
      accessibleCategories: accessibleCategories ?? [],
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate order type lookup access control',
      {
        context: 'order-type-business/evaluateOrderTypeLookupAccessControl',
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user access control for order type lookup',
      {
        details: err.message,
        stage: 'evaluate-order-type-lookup-access',
      }
    );
  }
};

/**
 * Enforces visibility rules on order type lookup filters based on user access.
 *
 * Rules:
 * - If the user lacks full category access, restrict to their assigned categories.
 * - If the user lacks keyword visibility access, inject `_restrictKeywordToValidOnly`.
 * - If the user lacks full status visibility, remove `statusId` and inject `_activeStatusId`.
 * - Throws an authorization error if the user has no accessible categories.
 *
 * @param {Object} filters - Original filters from the request (e.g., `keyword`, `statusId`, `category`)
 * @param {Object} access - User access context:
 *   - `canViewAllCategories: boolean`
 *   - `canViewAllKeywords: boolean`
 *   - `canViewAllStatuses: boolean`
 *   - `accessibleCategories: string[]`
 * @param {Object} [options={}] - Optional settings:
 *   - `activeStatusId: string` — The status ID to enforce if status visibility is restricted
 * @returns {Object} Adjusted filters with access rules applied
 * @throws {AppError} If user has no access to any order categories
 */
const enforceOrderTypeLookupVisibilityRules = (
  filters,
  access,
  options = {}
) => {
  const adjusted = { ...filters };

  // Enforce category restriction
  if (access.accessibleCategories && !access.canViewAllCategories) {
    if (access.accessibleCategories.length === 0) {
      throw AppError.authorizationError(
        'User is not authorized to view any order categories'
      );
    }
    adjusted.category = access.accessibleCategories;
  }

  // Enforce keyword visibility
  if (filters.keyword && !access.canViewAllKeywords) {
    adjusted._restrictKeywordToValidOnly = true;
  }

  // Enforce active-only status filtering
  if (!access.canViewAllStatuses) {
    delete adjusted.statusId;
    if (options.activeStatusId) {
      adjusted._activeStatusId = options.activeStatusId;
    }
  }

  return adjusted;
};

/**
 * Applies access control filters to an order type lookup query based on user permissions.
 *
 * - If the user lacks permission to view all statuses, the `statusId` filter is removed,
 *   and `_activeStatusId` must be injected.
 *
 * - If the user lacks permission to search keywords across all fields, the
 *   `_restrictKeywordToValidOnly` flag is enabled.
 *
 * - If the user lacks access to all categories, the `category` filter must be enforced
 *   (this is handled externally in `enforceOrderTypeLookupVisibilityRules`).
 *
 * @param {Object} query - Original query object from the client.
 * @param {Object} access - User access context:
 *   - `canViewAllStatuses`, `canViewAllKeywords`, `accessibleCategories`
 * @param {string} activeStatusId - Status ID to inject if restricting to active order types
 * @returns {Object} Modified query with enforced access filters
 */
const filterOrderTypeLookupQuery = (query, access, activeStatusId) => {
  try {
    const adjusted = { ...query };

    // Restrict status filtering if not allowed
    if (!access.canViewAllStatuses) {
      delete adjusted.statusId;
      if (activeStatusId) {
        adjusted._activeStatusId = activeStatusId;
      }
    }

    // Restrict keyword scope
    if (query.keyword && !access.canViewAllKeywords) {
      adjusted._restrictKeywordToValidOnly = true;
    }

    return adjusted;
  } catch (err) {
    logSystemException(
      err,
      'Failed to apply access filters in filterOrderTypeLookupQuery',
      {
        context: 'order-type-business/filterOrderTypeLookupQuery',
        originalQuery: query,
        access,
      }
    );

    throw AppError.businessError(
      'Failed to apply access control filters to order type query',
      {
        details: err.message,
        stage: 'filter-order-type-lookup-query',
      }
    );
  }
};

/**
 * Enriches an order type row with UI-friendly flags.
 *
 * Adds:
 * - `isActive`: true if the row's `status_id` matches the provided `activeStatusId`
 * - `requiresPayment`: boolean flag derived from the raw `requires_payment` field
 *
 * Validation:
 * - Throws a client-safe validation error if the row is missing or not an object.
 * - Throws a client-safe validation error if `activeStatusId` is missing or invalid.
 * - Full details (row type, contents, activeStatusId) are logged internally for diagnostics,
 *   but not exposed to the client.
 *
 * @param {object} row - Raw order type row from the database. Must include `status_id` and `requires_payment`.
 * @param {string} activeStatusId - UUID of the "active" status used for comparison.
 *
 * @returns {object} Enriched order type object including:
 *   - All original fields
 *   - `isActive` (boolean)
 *   - `requiresPayment` (boolean)
 *
 * @throws {AppError} If the row is invalid or `activeStatusId` is missing/invalid.
 */
const enrichOrderTypeRow = (row, activeStatusId) => {
  // Validate row
  if (!row || typeof row !== 'object') {
    logSystemError('[enrichOrderTypeRow] Invalid row type', {
      gotType: typeof row,
      row,
    });

    // Client-safe message
    throw AppError.validationError('Invalid order type data received.');
  }

  // Validate activeStatusId
  if (
    typeof activeStatusId !== 'string' ||
    activeStatusId.trim().length === 0
  ) {
    logSystemError('[enrichOrderTypeRow] Missing or invalid activeStatusId', {
      activeStatusId,
    });

    // Client-safe message
    throw AppError.validationError('Order type configuration is invalid.');
  }

  // Normalize values
  const statusId = row.status_id ?? null;
  const requiresPayment = Boolean(row.requires_payment);

  return {
    ...row,
    isActive: statusId === activeStatusId,
    requiresPayment,
  };
};

module.exports = {
  canViewOrderTypeCode,
  enforceOrderTypeCodeAccessControl,
  filterOrderTypeRowsByPermission,
  evaluateOrderTypeLookupAccessControl,
  enforceOrderTypeLookupVisibilityRules,
  filterOrderTypeLookupQuery,
  enrichOrderTypeRow,
};
