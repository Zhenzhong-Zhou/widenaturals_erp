/**
 * @file packaging-material-business.js
 * @description Domain business logic for packaging material access control
 * evaluation, visibility rule application, and lookup row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  PERMISSIONS,
} = require('../utils/constants/domain/packaging-material-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'packaging-material-business';

/**
 * Resolves which packaging material lookup visibility capabilities the
 * requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PackagingMaterialLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePackagingMaterialLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluatePackagingMaterialLookupAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewArchived:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_ARCHIVED_PACKAGING_MATERIALS),
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PACKAGING_STATUSES),
      canViewHiddenSalesMaterials:
        isRoot ||
        permissions.includes(PERMISSIONS.VIEW_HIDDEN_SALES_PACKAGING_MATERIALS),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate packaging material lookup access control',
      { context, userId: user?.id }
    );

    throw AppError.businessError(
      'Unable to evaluate access control for packaging material lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a packaging material lookup filter object.
 *
 * Restricted users are pinned to active and unarchived records only.
 * Elevated users retain any caller-provided status and archive filters.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {PackagingMaterialLookupAcl} userAccess - Resolved ACL from `evaluatePackagingMaterialLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 * @throws {AppError} validationError if `activeStatusId` is missing for restricted users.
 */
const enforcePackagingMaterialVisibilityRules = (
  filters,
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  if (!userAccess.canViewAllStatuses) {
    if (!activeStatusId) {
      throw AppError.validationError(
        'Missing activeStatusId for restricted status view.'
      );
    }

    // Pin to active and unarchived records for restricted users.
    delete adjusted.statusId;
    adjusted.restrictToActiveStatus = true;
    adjusted._activeStatusId = activeStatusId;
    adjusted.restrictToUnarchived = true;
  } else {
    // Elevated access — remove forced restrictions, retain caller-provided filters.
    delete adjusted._activeStatusId;
    delete adjusted.restrictToUnarchived;
  }

  return adjusted;
};

/**
 * Enriches a packaging material lookup row with derived boolean flags.
 *
 * @param {object} row - Raw packaging material row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, isArchived: boolean }}
 */
const enrichPackagingMaterialOption = (row, activeStatusId) => {
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isArchived: row.is_archived === true,
  };
};

module.exports = {
  evaluatePackagingMaterialLookupAccessControl,
  enforcePackagingMaterialVisibilityRules,
  enrichPackagingMaterialOption,
};
