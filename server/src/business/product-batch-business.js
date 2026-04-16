/**
 * @file product-batch-business.js
 * @description Domain business logic for product batch visibility evaluation,
 * filter rule application, access control resolution, and field-level update
 * filtering.
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
  PRODUCT_BATCH_PERMISSION_FIELD_RULES,
} = require('../utils/constants/domain/product-batch-constants');
const {
  resolveBatchEditableFields,
  filterUpdatableBatchFields,
} = require('./batches/batch-field-filter');

const CONTEXT = 'product-batch-business';

/**
 * Resolves which product batch visibility capabilities the requesting user holds.
 *
 * `canViewAllProductBatches` is a full override — it implies manufacturer
 * visibility and all keyword search capabilities.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<ProductBatchVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateProductBatchVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateProductBatchVisibility`;

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
      canViewAllProductBatches,
      canViewProductBatches,
      canViewManufacturer,
      // Derived keyword search capabilities — driven entirely by visibility flags.
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
      'Unable to evaluate product batch visibility.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a product batch filter object.
 *
 * Full override enables all keyword capabilities and leaves filters intact.
 * No product batch permission forces an empty result. Otherwise keyword
 * capabilities are injected from the ACL.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {ProductBatchVisibilityAcl} acl - Resolved ACL from `evaluateProductBatchVisibility`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applyProductBatchVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  // Full visibility override — enable all keyword capabilities.
  if (acl.canViewAllProductBatches) {
    adjusted.keywordCapabilities = {
      canSearchProduct: true,
      canSearchSku: true,
      canSearchManufacturer: true,
    };
    return adjusted;
  }

  // No product batch permission — fail closed.
  if (acl.canViewProductBatches !== true) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }

  // Inject keyword search capabilities from ACL.
  adjusted.keywordCapabilities = {
    canSearchProduct: acl.canSearchProduct,
    canSearchSku: acl.canSearchSku,
    canSearchManufacturer: acl.canSearchManufacturer,
  };

  return adjusted;
};

/**
 * Resolves which product batch edit capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<ProductBatchAccessAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateProductBatchAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateProductBatchAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
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
    logSystemException(err, 'Failed to evaluate product batch access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate product batch access control.'
    );
  }
};

/**
 * Resolves the set of fields the user is permitted to edit on a product batch,
 * based on their ACL flags and the product batch field rule configuration.
 *
 * @param {ProductBatchAccessAcl} access - Resolved ACL from `evaluateProductBatchAccessControl`.
 * @returns {Set<string>} Set of permitted field names.
 */
const getEditableFieldsForProductBatch = (access) =>
  resolveBatchEditableFields(access, PRODUCT_BATCH_PERMISSION_FIELD_RULES);

/**
 * Filters an update payload to only the fields permitted by the product batch's
 * current lifecycle state and the user's permission-based access flags.
 *
 * @param {object} params
 * @param {object} params.batch - Current batch record with `id` and `status_name`.
 * @param {object} [params.updates={}] - Requested update payload.
 * @param {ProductBatchAccessAcl} params.access - Resolved ACL.
 * @param {Record<string, string[]>} params.editRules - Lifecycle edit rules map.
 * @returns {object} Filtered update payload.
 * @throws {AppError} validationError if fields are not permitted or none remain.
 */
const filterUpdatableProductBatchFields = ({
  batch,
  updates,
  access,
  editRules,
}) =>
  filterUpdatableBatchFields({
    batch,
    updates,
    access,
    editRules,
    permissionResolver: getEditableFieldsForProductBatch,
    errorLabel: 'product batch',
  });

module.exports = {
  evaluateProductBatchVisibility,
  applyProductBatchVisibilityRules,
  evaluateProductBatchAccessControl,
  getEditableFieldsForProductBatch,
  filterUpdatableProductBatchFields,
};
