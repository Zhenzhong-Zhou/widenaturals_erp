/**
 * @file status-business.js
 * @description Domain business logic for status lookup access control
 * evaluation, visibility rule application, and lookup row enrichment.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  STATUS_CONSTANTS,
} = require('../utils/constants/domain/status-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'status-business';

/**
 * Resolves which status lookup visibility capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<StatusLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateStatusLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateStatusLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot ||
        permissions.includes(STATUS_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES),
      canViewActiveOnly:
        isRoot ||
        permissions.includes(STATUS_CONSTANTS.PERMISSIONS.VIEW_ACTIVE_STATUSES),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate status lookup access control', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate access control for status lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a status lookup filter object.
 *
 * Restricted users are pinned to active-only results via `is_active` and
 * `_isActiveEnforced`. Elevated users have those constraints removed.
 *
 * @param {object} [filters={}] - Base filter object from the request.
 * @param {StatusLookupAcl} userAccess - Resolved ACL from `evaluateStatusLookupAccessControl`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceStatusLookupVisibilityRules = (filters = {}, userAccess) => {
  const adjusted = { ...filters };
  
  if (!userAccess.canViewAllStatuses) {
    adjusted.is_active         ??= true;
    adjusted._isActiveEnforced   = true;
  } else {
    delete adjusted.is_active;
    delete adjusted._isActiveEnforced;
  }
  
  return adjusted;
};

/**
 * Enriches a status lookup row with a normalised `isActive` boolean flag.
 *
 * Accepts either `is_active` (snake_case from DB) or `isActive` (camelCase
 * from transformer) to handle both raw and transformed row shapes.
 *
 * @param {object} row - Raw or transformed status row.
 * @returns {object & { isActive: boolean }}
 */
const enrichStatusLookupOption = (row) => {
  const isActive =
    typeof row.is_active === 'boolean'
      ? row.is_active
      : Boolean(row.isActive);
  
  return {
    ...row,
    isActive,
  };
};

module.exports = {
  evaluateStatusLookupAccessControl,
  enforceStatusLookupVisibilityRules,
  enrichStatusLookupOption,
};
