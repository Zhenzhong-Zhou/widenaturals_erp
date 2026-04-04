/**
 * @file batch-status-business.js
 * @description Domain business logic for batch status visibility access control
 * evaluation, lookup filter rule application, and row enrichment.
 */

'use strict';

const { resolveUserPermissionContext } = require('../services/permission-service');
const { BATCH_CONSTANTS } = require('../utils/constants/domain/batch-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'batch-status-business';

/**
 * Resolves which batch status visibility capabilities the requesting user holds.
 *
 * `enforceActiveOnly` is the default — lifted only when the user holds inactive
 * or full visibility permission.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<BatchStatusVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateBatchStatusVisibilityAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateBatchStatusVisibilityAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewInactiveBatchStatuses =
      isRoot ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_ALL_BATCH_STATUSES
      ) ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_BATCH_STATUSES
      );
    
    return {
      canViewInactiveBatchStatuses,
      enforceActiveOnly: !canViewInactiveBatchStatuses,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate batch status visibility access control',
      {
        context,
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate batch status visibility access control.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a batch status lookup filter object.
 *
 * Without full visibility, active-only is enforced and any caller-supplied
 * `isActive` filter is removed to prevent override.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {BatchStatusVisibilityAcl} acl - Resolved ACL from `evaluateBatchStatusVisibilityAccessControl`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applyBatchStatusLookupVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  if (acl.canViewInactiveBatchStatuses) {
    delete adjusted.enforceActiveOnly;
    return adjusted;
  }
  
  // Active-only enforced — prevent clients from overriding via isActive filter.
  adjusted.enforceActiveOnly = true;
  delete adjusted.isActive;
  
  return adjusted;
};

/**
 * Enriches a batch status lookup row with a derived `isActive` boolean flag.
 *
 * @param {BatchStatusRow} row - Raw batch status row from the repository.
 * @returns {BatchStatusRow & { isActive: boolean }}
 */
const enrichBatchStatusLookupWithActiveFlag = (row) => {
  return {
    ...row,
    isActive: Boolean(row.is_active),
  };
};

module.exports = {
  evaluateBatchStatusVisibilityAccessControl,
  applyBatchStatusLookupVisibilityRules,
  enrichBatchStatusLookupWithActiveFlag,
};
