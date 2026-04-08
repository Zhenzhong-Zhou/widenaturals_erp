/**
 * @file packaging-material-batch-business.js
 * @description Domain business logic for packaging material batch visibility
 * evaluation, filter rule application, access control resolution, and
 * field-level update filtering.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  PACKAGING_BATCH_PERMISSION_FIELD_RULES,
} = require('../utils/constants/domain/packaging-material-batch-constants');
const {
  resolveBatchEditableFields,
  filterUpdatableBatchFields,
} = require('./batches/batch-field-filter');

const CONTEXT = 'packaging-material-batch-business';

/**
 * Resolves which packaging material batch visibility capabilities the
 * requesting user holds.
 *
 * `canViewAllPackagingBatches` is a full override — it implies supplier
 * visibility and all keyword search capabilities.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PackagingBatchVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePackagingMaterialBatchVisibility = async (user) => {
  const context = `${CONTEXT}/evaluatePackagingMaterialBatchVisibility`;
  
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
      canViewAllPackagingBatches,
      canViewPackagingBatches,
      canViewSupplier,
      // Derived keyword search capabilities — driven by visibility flags.
      canSearchMaterial:
        canViewAllPackagingBatches ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.SEARCH_BATCH_BY_MATERIAL
        ),
      canSearchSupplier:
        canViewAllPackagingBatches ||
        permissions.includes(
          BATCH_CONSTANTS.PERMISSIONS.SEARCH_BATCH_BY_SUPPLIER
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate packaging material batch visibility',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate packaging material batch visibility.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a packaging material batch filter object.
 *
 * Full override enables all keyword capabilities and leaves filters intact.
 * No packaging batch permission forces an empty result. Otherwise keyword
 * capabilities are injected from the ACL.
 *
 * Snapshot name and supplier label are always searchable when the user has
 * basic packaging batch visibility — they are batch-owned fields that do not
 * require additional permissions.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {PackagingBatchVisibilityAcl} acl - Resolved ACL from `evaluatePackagingMaterialBatchVisibility`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applyPackagingMaterialBatchVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  // Full visibility override — enable all keyword capabilities.
  if (acl.canViewAllPackagingBatches) {
    adjusted.keywordCapabilities = {
      canSearchInternalName: true,
      canSearchSupplierLabel: true,
      canSearchMaterialCode: true,
      canSearchSupplier: true,
    };
    return adjusted;
  }
  
  // No packaging batch permission — fail closed.
  if (acl.canViewPackagingBatches !== true) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }
  
  // Inject keyword search capabilities from ACL.
  // Internal name and supplier label are batch-owned — always searchable.
  adjusted.keywordCapabilities = {
    canSearchInternalName: true,
    canSearchSupplierLabel: true,
    canSearchMaterialCode: acl.canSearchMaterial,
    canSearchSupplier: acl.canSearchSupplier,
  };
  
  return adjusted;
};

/**
 * Resolves which packaging material batch edit capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PackagingBatchAccessAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePackagingMaterialBatchAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluatePackagingMaterialBatchAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
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
      'Failed to evaluate packaging material batch access control',
      { context, userId: user?.id }
    );
    
    throw AppError.businessError(
      'Unable to evaluate packaging material batch access control.'
    );
  }
};

/**
 * Resolves the set of fields the user is permitted to edit on a packaging
 * material batch, based on their ACL flags and the field rule configuration.
 *
 * @param {PackagingBatchAccessAcl} access - Resolved ACL from `evaluatePackagingMaterialBatchAccessControl`.
 * @returns {Set<string>} Set of permitted field names.
 */
const getEditableFieldsForPackagingBatch = (access) =>
  resolveBatchEditableFields(access, PACKAGING_BATCH_PERMISSION_FIELD_RULES);

/**
 * Filters an update payload to only the fields permitted by the packaging
 * material batch's current lifecycle state and the user's permission-based
 * access flags.
 *
 * @param {object} params
 * @param {object} params.batch - Current batch record with `id` and `status_name`.
 * @param {object} [params.updates={}] - Requested update payload.
 * @param {PackagingBatchAccessAcl} params.access - Resolved ACL.
 * @param {Record<string, string[]>} params.editRules - Lifecycle edit rules map.
 * @returns {object} Filtered update payload.
 * @throws {AppError} validationError if fields are not permitted or none remain.
 */
const filterUpdatablePackagingMaterialBatchFields = ({ batch, updates, access, editRules }) =>
  filterUpdatableBatchFields({
    batch,
    updates,
    access,
    editRules,
    permissionResolver: getEditableFieldsForPackagingBatch,
    errorLabel: 'packaging material batch',
  });

module.exports = {
  evaluatePackagingMaterialBatchVisibility,
  applyPackagingMaterialBatchVisibilityRules,
  evaluatePackagingMaterialBatchAccessControl,
  getEditableFieldsForPackagingBatch,
  filterUpdatablePackagingMaterialBatchFields,
};
