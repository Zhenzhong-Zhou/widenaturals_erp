const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { USER_CONSTANTS } = require('../utils/constants/domain/user-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');

/**
 * Business: Determine what categories of users the requester
 * is allowed to view in user list pages, directory views, or dropdowns.
 *
 * This function resolves visibility authority only.
 * It does NOT inspect filters, modify data, or apply query logic.
 *
 * Controls visibility of:
 *   ✔ Regular human users
 *   ✔ System / automation users
 *   ✔ Root-level users
 *   ✔ Full visibility override for privileged users
 *
 * Permission meanings:
 *   VIEW_SYSTEM_USERS          → Allows viewing system / automation users
 *   VIEW_ROOT_USERS            → Allows viewing root-level users
 *   VIEW_USERS_ALL_VISIBILITY  → Overrides all visibility restrictions
 *
 * @param {Object} user - Authenticated user context
 * @returns {Promise<{
 *   canViewSystemUsers: boolean,
 *   canViewRootUsers: boolean,
 *   canViewInactiveUsers: boolean,
 *   canViewAllUsers: boolean,
 *   enforceActiveOnly: boolean
 * }>}
 */
const evaluateUserVisibilityAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    // Can view system / automation users
    const canViewSystemUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_SYSTEM_USERS);
    
    // Can view root-level users
    const canViewRootUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_ROOT_USERS);
    
    const canViewInactiveUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_USERS);
    
    // Full override → can see all users regardless of category
    const canViewAllUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_USERS_ALL_VISIBILITY);
    
    // Derived rule:
    // Default to ACTIVE-only visibility unless explicitly permitted
    // to view inactive users or granted full visibility override
    const enforceActiveOnly = !canViewInactiveUsers && !canViewAllUsers;
    
    return {
      canViewSystemUsers,
      canViewRootUsers,
      canViewInactiveUsers,
      canViewAllUsers,
      enforceActiveOnly,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate user visibility access control', {
      context: 'user-business/evaluateUserVisibilityAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate user visibility access control.',
      { details: err.message }
    );
  }
};

/**
 * Business: Slice a user row based on visibility rules.
 *
 * Enforces WHAT categories of users the requester is allowed to view,
 * based on access flags from evaluateUserVisibilityAccessControl().
 *
 * NOTE:
 * Repository-level filtering is the primary enforcement.
 * This function provides a defensive, per-row safeguard.
 *
 * @param {Object} userRow - Raw row from repository
 * @param {Object} access - Flags from evaluateUserVisibilityAccessControl()
 * @returns {Object|null} User row or null if not visible
 */
const sliceUserForUser = (userRow, access) => {
  // Full override → see everything
  if (access.canViewAllUsers) return userRow;

  // Root user visibility
  // Root-ness is determined from the user row itself (role/type flag),
  // while permission to view root users comes from ACL
  if (!access.canViewRootUsers && access.isRoot === false) {
    // Root users should already be filtered by SQL,
    // this is defensive only
    return null;
  }
  
  // Status visibility (ACTIVE-only)
  if (
    access.enforceActiveOnly &&
    userRow.status_name !== 'active'
  ) {
    return null;
  }
  
  return userRow;
};

/**
 * Business: applyUserListVisibilityRules
 *
 * Adjust user list query filters based on visibility permissions.
 *
 * Responsibility:
 * - Translate ACL decisions into repository-consumable filter flags
 * - Enforce ACTIVE-only visibility for regular users (default)
 * - Allow privileged users to widen visibility
 *
 * Enforcement model:
 * - SQL filtering is the PRIMARY enforcement
 * - Row slicing is defensive only
 *
 * This function MUST:
 * - Set includeSystemUsers / includeRootUsers explicitly
 * - Set enforceActiveOnly + activeStatusId when required
 *
 * This function MUST NOT:
 * - Perform row-level filtering
 * - Infer permissions from roles
 * - Bypass repository visibility rules
 *
 * @param {Object} filters - Original query filters
 * @param {Object} acl - Result from evaluateUserVisibilityAccessControl()
 * @returns {Object} Adjusted filters for repository consumption
 */
const applyUserListVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  const ACTIVE_USER_STATUS_ID = getStatusId('general_active');
  
  // -------------------------------------------------------------
  // 1. Full override → no visibility restrictions
  // -------------------------------------------------------------
  if (acl.canViewAllUsers) {
    adjusted.includeSystemUsers = true;
    adjusted.includeRootUsers = true;
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
    delete adjusted.statusIds;
    return adjusted;
  }
  
  // -------------------------------------------------------------
  // 2. Status visibility (ACTIVE-only enforced unless permitted)
  // -------------------------------------------------------------
  if (acl.enforceActiveOnly) {
    adjusted.enforceActiveOnly = true;
    adjusted.activeStatusId = ACTIVE_USER_STATUS_ID;
    delete adjusted.statusIds;
  } else {
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
  }
  
  // -------------------------------------------------------------
  // 3. System user visibility
  // -------------------------------------------------------------
  adjusted.includeSystemUsers = acl.canViewSystemUsers === true;
  
  // -------------------------------------------------------------
  // 4. Root user visibility
  // -------------------------------------------------------------
  adjusted.includeRootUsers = acl.canViewRootUsers === true;
  
  return adjusted;
};

module.exports = {
  evaluateUserVisibilityAccessControl,
  sliceUserForUser,
  applyUserListVisibilityRules,
};
