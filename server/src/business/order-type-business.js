const {
  checkPermissions,
  resolveOrderAccessContext
} = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

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
 * Builds dynamic filters for fetching order types based on user permissions and an optional keyword.
 *
 * Behavior:
 * - Users with `root_access` bypass all restrictions (returning unrestricted filters).
 * - Users with category-specific permissions (e.g., `create_sales_order`) will be restricted
 *   to those categories and only include `active` order types.
 * - If a user has no access to any order categories (and is not a root user), an authorization error is thrown.
 * - If a `keyword` is provided, it is applied to filter order types by `name` or `code` (case-insensitive).
 *
 * @param {Object} user - Authenticated user object; must include a `role` field.
 * @param {string} [keyword] - Optional keyword to filter order types by name/code.
 * @returns {Promise<Object>} Returns a filter object containing `category`, `statusId`, and optionally `keyword`.
 * @throws {AppError} If the user does not have permission to view any order types.
 */
const getFilteredOrderTypes = async (user, keyword) => {
  try {
    const { isRoot, accessibleCategories } = await resolveOrderAccessContext(user);
    
    // Root access bypasses all restrictions
    if (isRoot) {
      return keyword ? { keyword } : {};
    }
    
    const filters = {
      category: accessibleCategories,
      statusId: getStatusId('order_type_active'),
    };
    
    if (keyword) {
      filters.keyword = keyword;
    }
    
    return filters;
  } catch (error) {
    logSystemException(error, 'Failed to build filtered order type query', {
      context: 'order-type-business/getFilteredOrderTypes',
      userId: user?.id,
      role: user?.role,
      keyword,
    });
    
    throw AppError.businessError('Unable to generate order type filters');
  }
};

/**
 * Filters and transforms a raw order type lookup result based on user permissions.
 *
 * - Users with `view_order_type` permission see full fields (e.g., `id`, `name`, `category`, etc.).
 * - Other users see only limited fields (e.g., `id`, `name`).
 *
 * @param {Object} user - Authenticated user object
 * @param {Array<Object>} rawResult - Raw-transformed result (e.g., from DB or transformer)
 * @returns {Promise<Array<Object>>} Filtered result based on access level
 */
const filterOrderTypeLookupResultByPermission = async (user, rawResult) => {
  const canViewAll = await checkPermissions(user, ['view_order_type']);
  
  if (canViewAll) {
    return rawResult;
  }
  
  // Strip sensitive fields for limited-permission users
  return rawResult.map(({ id, name }) => ({ id, name }));
};

module.exports = {
  canViewOrderTypeCode,
  enforceOrderTypeCodeAccessControl,
  filterOrderTypeRowsByPermission,
  getFilteredOrderTypes,
  filterOrderTypeLookupResultByPermission,
};
