const { checkPermissions, fetchPermissions } = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');
const { ORDER_CATEGORIES, CATEGORY_PERMISSION_MAP } = require('../utils/constants/domain/order-type-constants');
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
 * Builds dynamic filters for fetching order types based on user permissions and an optional keyword.
 *
 * Behavior:
 * - Users with `root_access` bypass all restrictions (return all categories and statuses).
 * - If the user has no specific `create_*_order` permissions, they are treated as elevated (e.g., admin)
 *   and can view all order types and statuses.
 * - If the user has category-specific permissions (e.g., `create_sales_order`, `create_transfer_order`),
 *   filters will restrict to those categories and enforce `active` status.
 * - If no accessible categories are found, an empty array is returned to indicate no access.
 * - If a `keyword` is provided, it is applied to filter by `name` or `code` (case-insensitive).
 *
 * @param {Object} user - Authenticated user object; must include a `role` field.
 * @param {string} [keyword] - Optional keyword to filter order types by name/code.
 * @returns {Promise<Object|Array>} Returns a filter object for DB lookup (`category`, `statusId`, `keyword`),
 *                                  or an empty array if no access.
 */
const getFilteredOrderTypes = async (user, keyword) => {
  try {
    const { permissions = [] } = await fetchPermissions(user.role);
    
    // Root access bypasses all restrictions
    const isRoot = permissions.includes('root_access');
    if (isRoot) {
      return keyword ? { keyword } : {};
    }
    
    // Derive accessible categories
    const accessibleCategories = ORDER_CATEGORIES.filter((category) =>
      permissions.includes(CATEGORY_PERMISSION_MAP[category])
    );
    
    const isElevated = accessibleCategories.length === 0;
    
    // Deny access if a user has no category permissions and is not root
    if (isElevated) {
      throw AppError.authorizationError('You do not have permission to view any order types');
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
  getFilteredOrderTypes,
  filterOrderTypeLookupResultByPermission,
};
