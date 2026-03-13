const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  PACKAGING_BATCH_PERMISSION_FIELD_RULES
} = require('../utils/constants/domain/packaging-material-batch-constants');
const { resolveEditableFields, filterUpdatableBatchFields } = require('./batches/batch-field-filter');

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

/**
 * Evaluates packaging material batch access control for a user.
 *
 * Resolves the user's permission context and derives
 * convenience flags used by batch mutation logic.
 *
 * Root users automatically bypass permission checks.
 *
 * @param {Object} user
 * @returns {Promise<{
 *   permissions: string[],
 *   isRoot: boolean,
 *   canEditBasicMetadata: boolean,
 *   canEditSensitiveMetadata: boolean,
 *   canChangeStatus: boolean
 * }>}
 */
const evaluatePackagingMaterialBatchAccessControl = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    return {
      permissions,
      isRoot,
      
      canEditBasicMetadata:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.EDIT_PACKAGING_BATCH_METADATA_BASIC
        ),
      
      canEditSensitiveMetadata:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.EDIT_PACKAGING_BATCH_METADATA_SENSITIVE
        ),
      
      canChangeStatus:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.CHANGE_PACKAGING_BATCH_STATUS
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate Packaging Material Batch access control',
      {
        context:
          'packaging-batch-business/evaluatePackagingMaterialBatchAccessControl',
        userId: user?.id,
      }
    );
    
    if (err instanceof AppError) throw err;
    
    throw AppError.businessError(
      'Unable to evaluate access control for Packaging Material Batch',
      {
        details: err.message,
        stage: 'evaluate-packaging-batch-access',
      }
    );
  }
};

/**
 * Resolves editable fields for a packaging material batch based on
 * the current user's access-control flags.
 *
 * This is a thin wrapper around `resolveEditableFields` that applies
 * packaging-batch specific permission field rules.
 *
 * @param {Object} access
 * Access-control flags for the current user.
 *
 * @param {boolean} access.isRoot
 * Indicates whether the user has root privileges.
 *
 * @param {boolean} [access.canEditBasicMetadata]
 * Permission to edit non-sensitive batch metadata.
 *
 * @param {boolean} [access.canEditSensitiveMetadata]
 * Permission to edit sensitive metadata fields.
 *
 * @param {boolean} [access.canChangeStatus]
 * Permission to change the batch lifecycle status.
 *
 * @returns {Set<string>}
 * Set of field names the user is permitted to edit.
 */
const getEditableFieldsForPackagingBatch = (access) =>
  resolveEditableFields(access, PACKAGING_BATCH_PERMISSION_FIELD_RULES);

/**
 * Filters and validates packaging material batch update fields.
 *
 * This function is a thin wrapper around the generic
 * `filterUpdatableBatchFields` validator. It injects the
 * packaging-batch-specific permission resolver and error label.
 *
 * The underlying validator enforces:
 *
 * 1. Lifecycle edit rules based on the batch's current status
 * 2. Permission-based field editing rules derived from user access
 *
 * The final editable fields are determined as:
 *
 *   allowedFields =
 *      lifecycleAllowedFields
 *      ∩
 *      permissionAllowedFields
 *
 * Any attempted update outside this set will be rejected.
 *
 * @param {Object} params
 * @param {Object} params.batch - Current batch record
 * @param {Object} params.updates - Requested update payload
 * @param {Object} params.access - Access control flags
 * @param {Record<string,string[]>} params.editRules - Lifecycle edit rules
 *
 * @returns {Object} Filtered update payload safe to apply
 */
const filterUpdatablePackagingMaterialBatchFields = (params) =>
  filterUpdatableBatchFields({
    ...params,
    permissionResolver: getEditableFieldsForPackagingBatch,
    errorLabel: 'packaging material batch',
  });

module.exports = {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
  evaluatePackagingMaterialBatchAccessControl,
  filterUpdatablePackagingMaterialBatchFields,
};
