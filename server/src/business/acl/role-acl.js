const { resolveUserPermissionContext } = require('../../services/role-permission-service');
const { ROLE_CONSTANTS } = require('../../utils/constants/domain/role-constants');
const { logSystemException } = require('../../utils/system-logger');
const AppError = require('../../utils/AppError');

/**
 * Business: Determine role visibility scope for the requester.
 *
 * Roles are security primitives.
 * Visibility must be conservative and explicit.
 *
 * @param {object} user - Authenticated user context
 * @returns {Promise<{
 *   canViewAllStatuses: boolean,
 *   canViewInactiveRoles: boolean,
 *   canQueryRoleHierarchy: boolean
 * }>}
 */
const evaluateRoleVisibilityAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAllStatuses =
      isRoot ||
      permissions.includes(ROLE_CONSTANTS.PERMISSIONS.VIEW_ALL_ROLES);
    
    const canViewInactiveRoles =
      canViewAllStatuses ||
      permissions.includes(ROLE_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_ROLES);
    
    const canQueryRoleHierarchy =
      isRoot ||
      permissions.includes(ROLE_CONSTANTS.PERMISSIONS.MANAGE_ROLES);
    
    return {
      canViewAllStatuses,
      canViewInactiveRoles,
      canQueryRoleHierarchy,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate role visibility ACL', {
      context: 'role-business/evaluateRoleVisibilityAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate role visibility access control.',
      { details: err.message }
    );
  }
};

/**
 * Business: applyRoleVisibilityRules
 *
 * Translates role ACL decisions into repository-enforced filters.
 *
 * IMPORTANT:
 * - This function does NOT validate user input.
 * - It only injects or removes filters based on ACL.
 *
 * @param {{
 *   statusIds?: string[],
 *   status_id?: string,
 *   _activeStatusId?: string,
 *   parent_role_id?: string,
 *   hierarchy_level?: number,
 *   [key: string]: any
 * }} filters - Incoming role query filters
 *
 * @param {{
 *   canViewInactiveRoles: boolean,
 *   canQueryRoleHierarchy: boolean
 * }} acl - Role visibility access control flags
 *
 * @param {string} activeStatusId - Status ID representing active roles
 *
 * @returns {object} Adjusted filters safe for repository consumption
 */
const applyRoleVisibilityRules = (filters, acl, activeStatusId) => {
  const adjusted = { ...filters };
  
  // ---------------------------------------------------------
  // 1. Status enforcement (ACTIVE-only unless permitted)
  // ---------------------------------------------------------
  if (!acl.canViewInactiveRoles) {
    delete adjusted.statusIds;
    delete adjusted.status_id;
    adjusted._activeStatusId = activeStatusId;
  }
  
  // ---------------------------------------------------------
  // 2. Hierarchy protection
  // ---------------------------------------------------------
  if (!acl.canQueryRoleHierarchy) {
    delete adjusted.parent_role_id;
    delete adjusted.hierarchy_level;
  }
  
  return adjusted;
};

module.exports = {
  evaluateRoleVisibilityAccessControl,
  applyRoleVisibilityRules,
};
