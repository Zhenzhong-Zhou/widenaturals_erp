const { getSkuAndProductStatus } = require('../repositories/sku-repository');
const AppError = require('../utils/AppError');
const { checkPermissions } = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');
const { logSystemException } = require('../utils/system-logger');

/**
 * Resolves the allowed product/SKU status IDs for the given user.
 * Returns `null` to indicate no restriction (full visibility).
 *
 * @param {object} user - Authenticated user
 * @returns {Promise<string[] | null>}
 */
const getAllowedStatusIdsForUser = async (user) => {
  const canViewAll = await checkPermissions(user, ['view_all_product_statuses'], {
    allowRootAccess: true,
  });

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

    const { skuStatusId, productStatusId } = await getSkuAndProductStatus(skuId);

    if (
      !allowedStatusIds.includes(skuStatusId) ||
      !allowedStatusIds.includes(productStatusId)
    ) {
      throw AppError.authorizationError('You do not have permission to access this SKU');
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

module.exports = {
  getAllowedStatusIdsForUser,
  getAllowedPricingTypesForUser,
  canAccessSku,
};
