const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Determine packaging material batch visibility authority.
 *
 * Resolves PACKAGING MATERIAL BATCH visibility ONLY.
 * No filter logic, no SQL, no joins.
 *
 * @param {Object} user
 * @returns {Promise<{
 *   canViewPackagingBatches: boolean,
 *   canViewSupplier: boolean,
 *   canViewAllPackagingBatches: boolean,
 *   canSearchMaterial: boolean,
 *   canSearchSupplier: boolean
 * }>}
 */
const evaluatePackagingMaterialBatchVisibility = async (user) => {
  const context =
    'packaging-material-batch-business/evaluatePackagingMaterialBatchVisibility';

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllPackagingBatches =
      isRoot ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_ALL_VISIBILITY
      );

    const canViewPackagingBatches =
      canViewAllPackagingBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_PACKAGING_BATCHES);

    const canViewSupplier =
      canViewAllPackagingBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_SUPPLIER);

    return {
      canViewPackagingBatches,
      canViewSupplier,
      canViewAllPackagingBatches,

      // Derived keyword capabilities
      canSearchMaterial:
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.SEARCH_BATCH_BY_MATERIAL
        ) || canViewAllPackagingBatches,

      canSearchSupplier:
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.SEARCH_BATCH_BY_SUPPLIER
        ) || canViewAllPackagingBatches,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate packaging material batch visibility',
      { context, userId: user?.id }
    );

    throw AppError.businessError(
      'Unable to evaluate packaging material batch visibility.',
      { details: err.message }
    );
  }
};

/**
 * Business: applyPackagingMaterialBatchVisibilityRules
 *
 * Narrows packaging material batch query filters based on visibility ACL.
 *
 * @param {Object} filters - User-requested filters
 * @param {Object} acl - Result from evaluatePackagingMaterialBatchVisibility()
 * @returns {Object} Adjusted filters
 */
const applyPackagingMaterialBatchVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  // -----------------------------------------
  // 1. Full visibility override
  // -----------------------------------------
  if (acl.canViewAllPackagingBatches) {
    adjusted.keywordCapabilities = {
      canSearchInternalName: true,
      canSearchSupplierLabel: true,
      canSearchMaterialCode: true,
      canSearchSupplier: true,
    };
    return adjusted;
  }

  // -----------------------------------------
  // 2. No permission → fail closed
  // -----------------------------------------
  if (acl.canViewPackagingBatches !== true) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }

  // -----------------------------------------
  // 3. Inject keyword search capabilities
  // -----------------------------------------
  adjusted.keywordCapabilities = {
    canSearchInternalName: true, // snapshot name is always allowed
    canSearchSupplierLabel: true, // supplier label is batch-owned
    canSearchMaterialCode: acl.canSearchMaterial,
    canSearchSupplier: acl.canSearchSupplier,
  };

  return adjusted;
};

module.exports = {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
};
