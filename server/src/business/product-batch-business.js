const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Determine product batch visibility authority.
 *
 * Resolves PRODUCT BATCH visibility ONLY.
 * No filter logic, no query execution.
 *
 * @param {Object} user
 * @returns {Promise<{
 *   canViewProductBatches: boolean,
 *   canViewManufacturer: boolean,
 *   canViewAllProductBatches: boolean,
 *   canSearchProduct: boolean,
 *   canSearchSku: boolean,
 *   canSearchManufacturer: boolean
 * }>}
 */
const evaluateProductBatchVisibility = async (user) => {
  const context = 'product-batch-business/evaluateProductBatchVisibility';

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllProductBatches =
      isRoot ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_ALL_VISIBILITY
      );

    const canViewProductBatches =
      canViewAllProductBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_PRODUCT_BATCHES);

    const canViewManufacturer =
      canViewAllProductBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_MANUFACTURER);

    return {
      canViewProductBatches,
      canViewManufacturer,
      canViewAllProductBatches,

      // Derived keyword capabilities
      canSearchProduct: canViewProductBatches,
      canSearchSku: canViewProductBatches,
      canSearchManufacturer: canViewManufacturer,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate product batch visibility', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate product batch visibility.',
      { details: err.message }
    );
  }
};

/**
 * Business: applyProductBatchVisibilityRules
 *
 * Narrows product batch query filters based on visibility ACL.
 *
 * @param {Object} filters - User-requested filters
 * @param {Object} acl - Result from evaluateProductBatchVisibility()
 * @returns {Object} Adjusted filters
 */
const applyProductBatchVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  // -----------------------------------------
  // 1. Full visibility override
  // -----------------------------------------
  if (acl.canViewAllProductBatches) {
    adjusted.keywordCapabilities = {
      canSearchProduct: true,
      canSearchSku: true,
      canSearchManufacturer: true,
    };
    return adjusted;
  }

  // -----------------------------------------
  // 2. No permission → fail closed
  // -----------------------------------------
  if (acl.canViewProductBatches !== true) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }

  // -----------------------------------------
  // 3. Inject keyword search capabilities
  // -----------------------------------------
  adjusted.keywordCapabilities = {
    canSearchProduct: acl.canSearchProduct,
    canSearchSku: acl.canSearchSku,
    canSearchManufacturer: acl.canSearchManufacturer,
  };

  return adjusted;
};

module.exports = {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
};
