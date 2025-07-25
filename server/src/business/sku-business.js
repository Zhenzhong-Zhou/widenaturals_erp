const { getSkuAndProductStatus } = require('../repositories/sku-repository');
const AppError = require('../utils/AppError');
const { checkPermissions, resolveUserPermissionContext } = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');
const { logSystemException } = require('../utils/system-logger');
const { PERMISSIONS } = require('../utils/constants/domain/sku-constants');

/**
 * Resolves the allowed product/SKU status IDs for the given user.
 * Returns `null` to indicate no restriction (full visibility).
 *
 * @param {object} user - Authenticated user
 * @returns {Promise<string[] | null>}
 */
const getAllowedStatusIdsForUser = async (user) => {
  const canViewAll = await checkPermissions(
    user,
    ['view_all_product_statuses'],
    {
      allowRootAccess: true,
    }
  );

  return canViewAll ? null : [getStatusId('product_active')];
};

/**
 * Resolves the allowed pricing type codes a user is allowed to see.
 * Returns `null` to indicate all types are allowed.
 *
 * @param {object} user - Authenticated user
 * @returns {Promise<string[] | null>} - Pricing type codes (e.g., ['PRC-M001', 'PRC-R003'])
 */
const getAllowedPricingTypesForUser = async (user) => {
  const canViewAll = await checkPermissions(user, ['view_all_pricing_types'], {
    allowRootAccess: true,
  });

  // Retail = PRC-R003, MSRP = PRC-M001
  return canViewAll ? null : ['PRC-M001', 'PRC-R003'];
};

/**
 * Determines whether the user is authorized to view the given SKU,
 * based on product/SKU status and user permissions.
 *
 * @param {object} user - Authenticated user object (must include id and role_id)
 * @param {string} skuId - The ID of the SKU to evaluate
 * @returns {Promise<boolean>}
 * @throws {AppError} If the user is not allowed to access the SKU
 */
const canAccessSku = async (user, skuId) => {
  try {
    const allowedStatusIds = await getAllowedStatusIdsForUser(user);
    if (!allowedStatusIds) return true; // root or elevated roles bypass restrictions

    const { skuStatusId, productStatusId } =
      await getSkuAndProductStatus(skuId);

    if (
      !allowedStatusIds.includes(skuStatusId) ||
      !allowedStatusIds.includes(productStatusId)
    ) {
      throw AppError.authorizationError(
        'You do not have permission to access this SKU'
      );
    }

    return true;
  } catch (err) {
    logSystemException('Access check failed in canAccessSku()', {
      context: 'canAccessSku',
      skuId,
      userId: user?.id,
      error: err,
    });
    throw err;
  }
};

/**
 * Evaluates whether the user is allowed to bypass SKU stock and status filters
 * in SKU lookup queries (e.g., for sales, internal orders, or admin overrides).
 *
 * Resolves to a flag `allowAllSkus` that enables visibility of inactive or out-of-stock SKUs.
 * Common use cases include:
 * - Admin overrides
 * - Internal sample or R&D orders
 * - Backorders / preorders
 *
 * @param {Object} user - Authenticated user object (must include ID or context).
 * @returns {Promise<{ allowAllSkus: boolean }>} Access control decision for SKU visibility.
 */
const evaluateSkuFilterAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const allowAllSkus =
      isRoot ||
      permissions.includes(PERMISSIONS.ADMIN_OVERRIDE_SKU_FILTERS) ||
      permissions.includes(PERMISSIONS.ALLOW_INTERNAL_ORDER_SKUS) ||
      permissions.includes(PERMISSIONS.ALLOW_BACKORDER_SKUS);
    
    return { allowAllSkus };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU filter access control', {
      context: 'sku-business/evaluateSkuFilterAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to evaluate SKU filter access control', {
      details: err.message,
      stage: 'evaluate-sku-access',
    });
  }
};

/**
 * Enforces visibility restrictions on SKU filtering
 * based on the user's access control flags.
 *
 * - If the user lacks permission to view all SKUs, `allowAllSkus` is false
 *   and filtering for available stock is automatically enabled.
 * - The `requireAvailableStockFrom` option is defaulted to `'warehouse'`
 *   if not explicitly set, ensuring controlled source visibility.
 *
 * This function is useful for SKU lookup queries where inactive or out-of-stock
 * products should be hidden unless elevated access is granted (e.g., internal orders).
 *
 * @param {Object} options - Original options object used in SKU queries.
 * @param {Object} userAccess - User access flags, e.g., `{ allowAllSkus: boolean }`.
 * @returns {Object} Adjusted options with enforced SKU visibility rules.
 */
const enforceSkuLookupVisibilityRules = (options = {}, userAccess = {}) => {
  const adjusted = {
    ...options,
    allowAllSkus: !!userAccess.allowAllSkus,
  };
  
  // Force stock check if not allowed to see inactive or out-of-stock SKUs
  if (!userAccess.allowAllSkus) {
    adjusted.requireAvailableStock = true;
    
    // Default to warehouse if not specified
    adjusted.requireAvailableStockFrom =
      adjusted.requireAvailableStockFrom || 'warehouse';
  }
  
  return adjusted;
};

/**
 * Applies access control filters to a SKU lookup query based on user permissions.
 *
 * If the user lacks permission to view inactive SKUs, `status_id` is restricted to active.
 * If the user lacks permission to view out-of-stock SKUs, a virtual flag
 * `requireAvailableStock = true` is added (to enforce EXISTS stock check in builder).
 *
 * @param {Object} query - Original query object with filters and options.
 * @param {Object} userAccess - Access flags (e.g., `allowAllSkus`).
 * @param {string} activeStatusId - UUID for the 'active' SKU/product status.
 * @returns {Object} Modified query object with enforced filters.
 */
const filterSkuLookupQuery = (query, userAccess, activeStatusId) => {
  try {
    const modified = { ...query };
    
    if (!userAccess.allowAllSkus) {
      // Enforce active status on both SKU and Product level
      modified.sku_status_id = activeStatusId;
      modified.product_status_id = activeStatusId;
      
      // Flag to trigger EXISTS clause in builder (for warehouse or location inventory)
      modified.requireAvailableStock = true;
      
      // Optional: default stock source if not provided
      modified.requireAvailableStockFrom =
        modified.requireAvailableStockFrom || 'warehouse';
    }
    
    return modified;
  } catch (err) {
    logSystemException(err, 'Failed to apply access filters in filterSkuLookupQuery', {
      context: 'sku-business/filterSkuLookupQuery',
      originalQuery: query,
      userAccess,
    });
    
    throw AppError.businessError('Unable to apply SKU lookup access filters', {
      details: err.message,
      stage: 'filter-sku-lookup',
      cause: err,
    });
  }
};

module.exports = {
  getAllowedStatusIdsForUser,
  getAllowedPricingTypesForUser,
  canAccessSku,
  evaluateSkuFilterAccessControl,
  enforceSkuLookupVisibilityRules,
  filterSkuLookupQuery,
};
