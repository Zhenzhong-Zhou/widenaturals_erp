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
 * Converts access control flags into the set of fields
 * a user is permitted to modify for a packaging material batch.
 *
 * This function maps permission flags to field-level
 * editing rights defined in `PACKAGING_BATCH_PERMISSION_FIELD_RULES`.
 *
 * @param {Object} access
 * @param {boolean} access.canEditBasicMetadata
 * @param {boolean} access.canEditSensitiveMetadata
 * @param {boolean} access.canChangeStatus
 *
 * @returns {Set<string>} allowed editable fields
 */
const getEditableFieldsForPackagingBatch = (access) => {
  const allowed = new Set();
  
  if (access.canEditBasicMetadata) {
    PACKAGING_BATCH_PERMISSION_FIELD_RULES
      .edit_batch_metadata_basic
      .forEach((f) => allowed.add(f));
  }
  
  if (access.canEditSensitiveMetadata) {
    PACKAGING_BATCH_PERMISSION_FIELD_RULES
      .edit_batch_metadata_sensitive
      .forEach((f) => allowed.add(f));
  }
  
  if (access.canChangeStatus) {
    PACKAGING_BATCH_PERMISSION_FIELD_RULES
      .change_batch_status
      .forEach((f) => allowed.add(f));
  }
  
  return allowed;
};

/**
 * Filters and validates packaging material batch update fields.
 *
 * This function enforces both:
 *
 * 1. Lifecycle edit rules based on the batch's current status
 * 2. Permission-based field editing rules
 *
 * Final editable fields are calculated as:
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
 * @param {Object} params.access - Access control object
 * @param {Record<string, string[]>} params.editRules - Lifecycle edit rules
 *
 * @returns {Object} filtered update payload safe to apply
 */
const filterUpdatablePackagingMaterialBatchFields = ({
                                                       batch,
                                                       updates = {},
                                                       access,
                                                       editRules,
                                                     }) => {
  //------------------------------------------------------------
  // Validate update payload structure
  //------------------------------------------------------------
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError(
      'Invalid packaging material batch update payload.'
    );
  }
  
  //------------------------------------------------------------
  // 1. Lifecycle editable fields
  //------------------------------------------------------------
  const lifecycleFields = editRules[batch.status] ?? [];
  
  //------------------------------------------------------------
  // 2. Permission editable fields
  //------------------------------------------------------------
  const permissionFields =
    getEditableFieldsForPackagingBatch(access);
  
  //------------------------------------------------------------
  // 3. Compute final allowed fields (intersection)
  //------------------------------------------------------------
  const allowedFields = lifecycleFields.filter((field) =>
    permissionFields.has(field)
  );
  
  //------------------------------------------------------------
  // 4. Detect invalid update attempts
  //------------------------------------------------------------
  const invalidFields = Object.keys(updates).filter(
    (field) => !allowedFields.includes(field)
  );
  
  if (invalidFields.length) {
    throw AppError.validationError(
      `You are not allowed to modify: ${invalidFields.join(', ')}`
    );
  }
  
  //------------------------------------------------------------
  // 5. Filter update payload
  //------------------------------------------------------------
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    )
  );
  
  if (!Object.keys(filtered).length) {
    throw AppError.validationError(
      'No valid editable packaging material batch fields provided.'
    );
  }
  
  return filtered;
};

module.exports = {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
  evaluatePackagingMaterialBatchAccessControl,
  filterUpdatablePackagingMaterialBatchFields,
};
