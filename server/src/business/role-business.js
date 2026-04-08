/**
 * @file role-business.js
 * @description Domain business logic for role visibility access control
 * evaluation and filter rule application.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { ROLE_CONSTANTS } = require('../utils/constants/domain/role-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'role-business';

/**
 * Resolves which role visibility capabilities the requesting user holds.
 *
 * Role visibility policy flags (`excludeSystemRoles`, `excludeRootRoles`,
 * `excludeAdminRoles`) are derived from role name and root status — they
 * control which role tiers appear in query results.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<RoleVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateRoleVisibilityAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateRoleVisibilityAccessControl`;
  
  try {
    const { permissions, isRoot, roleName } =
      await resolveUserPermissionContext(user);
    
    const isAdmin = roleName === 'admin';
    const isSystem = roleName === 'system';
    
    const canViewInactiveRoles =
      isRoot ||
      permissions.includes(ROLE_CONSTANTS.PERMISSIONS.VIEW_ALL_ROLES) ||
      permissions.includes(ROLE_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_ROLES);
    
    const canQueryRoleHierarchy =
      isRoot || permissions.includes(ROLE_CONSTANTS.PERMISSIONS.MANAGE_ROLES);
    
    return {
      canViewInactiveRoles,
      canQueryRoleHierarchy,
      excludeSystemRoles: !isRoot && !isSystem,
      excludeRootRoles: !isRoot,
      excludeAdminRoles: !isRoot && !isAdmin,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate role visibility ACL', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate role visibility access control.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a role filter object.
 *
 * - Status enforcement: removes caller-supplied status filters and pins to
 *   active-only when the user cannot view inactive roles.
 * - Hierarchy protection: removes hierarchy filter params when the user lacks
 *   role management permission.
 * - Role tier exclusions: injects `_exclude*` flags consumed by the filter
 *   builder to scope the query to permitted role tiers.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {RoleVisibilityAcl} acl - Resolved ACL from `evaluateRoleVisibilityAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applyRoleVisibilityRules = (filters, acl, activeStatusId) => {
  const adjusted = { ...filters };
  
  // 1. Status enforcement — pin to active when inactive roles are not permitted.
  if (!acl.canViewInactiveRoles) {
    delete adjusted.statusIds;
    delete adjusted.status_id;
    adjusted._activeStatusId = activeStatusId;
  }
  
  // 2. Hierarchy protection — strip hierarchy params for unpermitted callers.
  if (!acl.canQueryRoleHierarchy) {
    delete adjusted.parent_role_id;
    delete adjusted.hierarchy_level;
  }
  
  // 3. Role tier exclusions — consumed by the filter builder.
  if (acl.excludeSystemRoles) adjusted._excludeSystemRoles = true;
  if (acl.excludeRootRoles) adjusted._excludeRootRoles = true;
  if (acl.excludeAdminRoles) adjusted._excludeAdminRoles = true;
  
  return adjusted;
};

module.exports = {
  evaluateRoleVisibilityAccessControl,
  applyRoleVisibilityRules,
};
