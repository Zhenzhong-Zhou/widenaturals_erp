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
const { resolveEditableFields, filterUpdatableBatchFields } = require('./batches/batch-field-filter');

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
 * Resolves editable fields for a product batch based on
 * the current user's access-control flags.
 *
 * This wrapper delegates permission resolution to
 * `resolveEditableFields` using product-batch specific rules.
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
 * @param {boolean} [access.canEditReleaseMetadata]
 * Permission to edit release-related metadata fields.
 *
 * @param {boolean} [access.canChangeStatus]
 * Permission to change the batch lifecycle status.
 *
 * @returns {Set<string>}
 * Set of field names the user is permitted to edit.
 */
const getEditableFieldsForProductBatch = (access) =>
  resolveEditableFields(access, PRODUCT_BATCH_PERMISSION_FIELD_RULES);

/**
 * Filters and validates product batch update fields.
 *
 * This function is a thin wrapper around the generic
 * `filterUpdatableBatchFields` validator. It injects the
 * product-batch-specific permission resolver and error label.
 *
 * Validation performed by the underlying function includes:
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
const filterUpdatableProductBatchFields = (params) =>
  filterUpdatableBatchFields({
    ...params,
    permissionResolver: getEditableFieldsForProductBatch,
    errorLabel: 'product batch'
  });

module.exports = {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
  evaluateProductBatchAccessControl,
  filterUpdatableProductBatchFields,
};
