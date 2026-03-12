const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const {
  PRODUCT_BATCH_PERMISSION_FIELD_RULES
} = require('../utils/constants/domain/product-batch-constants');

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

/**
 * Evaluates product batch access control for a user.
 *
 * This resolves the user's permission context and derives
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
 *   canEditReleaseMetadata: boolean,
 *   canChangeStatus: boolean
 * }>}
 */
const evaluateProductBatchAccessControl = async (user) => {
  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(user);
    
    return {
      permissions,
      isRoot,
      
      canEditBasicMetadata:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.EDIT_PRODUCT_BATCH_METADATA_BASIC
        ),
      
      canEditSensitiveMetadata:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.EDIT_PRODUCT_BATCH_METADATA_SENSITIVE
        ),
      
      canEditReleaseMetadata:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.EDIT_PRODUCT_BATCH_RELEASE_METADATA
        ),
      
      canChangeStatus:
        isRoot ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.CHANGE_PRODUCT_BATCH_STATUS
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate Product Batch access control',
      {
        context: 'product-batch-business/evaluateProductBatchAccessControl',
        userId: user?.id,
      }
    );
    
    if (err instanceof AppError) throw err;
    
    throw AppError.businessError(
      'Unable to evaluate access control for Product Batch',
      {
        details: err.message,
        stage: 'evaluate-product-batch-access',
      }
    );
  }
};

/**
 * Converts access control flags into the set of fields
 * a user is permitted to modify for a product batch.
 *
 * This function maps permission flags to field-level
 * editing rights defined in `PRODUCT_BATCH_PERMISSION_FIELD_RULES`.
 *
 * @param {Object} access
 * @param {boolean} access.canEditBasicMetadata
 * @param {boolean} access.canEditSensitiveMetadata
 * @param {boolean} access.canEditReleaseMetadata
 * @param {boolean} access.canChangeStatus
 *
 * @returns {Set<string>} allowed editable field names
 */
const getEditableFieldsForProductBatch = (access) => {
  const allowed = new Set();
  
  if (access.canEditBasicMetadata) {
    PRODUCT_BATCH_PERMISSION_FIELD_RULES
      .edit_batch_metadata_basic
      .forEach((f) => allowed.add(f));
  }
  
  if (access.canEditSensitiveMetadata) {
    PRODUCT_BATCH_PERMISSION_FIELD_RULES
      .edit_batch_metadata_sensitive
      .forEach((f) => allowed.add(f));
  }
  
  if (access.canEditReleaseMetadata) {
    PRODUCT_BATCH_PERMISSION_FIELD_RULES
      .edit_batch_release_metadata
      .forEach((f) => allowed.add(f));
  }
  
  if (access.canChangeStatus) {
    PRODUCT_BATCH_PERMISSION_FIELD_RULES
      .change_batch_status
      .forEach((f) => allowed.add(f));
  }
  
  return allowed;
};

/**
 * Filters and validates product batch update fields.
 *
 * This function enforces both:
 *
 * 1. Lifecycle edit rules (based on current batch status)
 * 2. Permission-based field editing rules
 *
 * Final editable fields are calculated as:
 *
 *   allowedFields =
 *      lifecycleAllowedFields
 *      ∩
 *      permissionAllowedFields
 *
 * Any attempted update outside this set is rejected.
 *
 * @param {Object} params
 * @param {Object} params.batch - Current batch record
 * @param {Object} params.updates - Requested update payload
 * @param {Object} params.access - Access control object
 * @param {Record<string, string[]>} params.editRules - Lifecycle rules
 *
 * @returns {Object} filtered update payload safe to apply
 */
const filterUpdatableProductBatchFields = ({
                                             batch,
                                             updates = {},
                                             access,
                                             editRules,
                                           }) => {
  //------------------------------------------------------------
  // Validate payload structure
  //------------------------------------------------------------
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError(
      'Invalid product batch update payload.'
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
    getEditableFieldsForProductBatch(access);
  
  //------------------------------------------------------------
  // 3. Compute final allowed fields (intersection)
  //------------------------------------------------------------
  const allowedFields = lifecycleFields.filter((f) =>
    permissionFields.has(f)
  );
  
  //------------------------------------------------------------
  // 4. Detect invalid update attempts
  //------------------------------------------------------------
  const invalidFields = Object.keys(updates).filter(
    (f) => !allowedFields.includes(f)
  );
  
  if (invalidFields.length) {
    throw AppError.validationError(
      `You are not allowed to modify: ${invalidFields.join(', ')}`
    );
  }
  
  //------------------------------------------------------------
  // 5. Filter payload to safe fields only
  //------------------------------------------------------------
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      allowedFields.includes(key)
    )
  );
  
  if (!Object.keys(filtered).length) {
    throw AppError.validationError(
      'No valid editable product batch fields provided.'
    );
  }
  
  return filtered;
};

module.exports = {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
  evaluateProductBatchAccessControl,
  filterUpdatableProductBatchFields,
};
