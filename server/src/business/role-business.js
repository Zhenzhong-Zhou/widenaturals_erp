const { resolveUserPermissionContext } = require('../services/role-permission-service');
const { ROLE_CONSTANTS } = require('../utils/constants/domain/role-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Business: Evaluate role visibility access control for the requester.
 *
 * Roles are security primitives.
 * Visibility rules must be conservative, explicit, and centrally enforced.
 *
 * This function:
 * - Resolves the caller’s permission context
 * - Determines high-level role visibility capabilities
 * - Emits internal role-exclusion flags for downstream business logic
 *
 * IMPORTANT:
 * - Returned flags represent POLICY decisions, not UI hints
 * - These flags MUST be consumed by the business layer
 * - They MUST NOT originate from client input
 *
 * @param {object} user - Authenticated user context
 *
 * @returns {Promise<{
 *   canViewAllStatuses: boolean,
 *   canViewInactiveRoles: boolean,
 *   canQueryRoleHierarchy: boolean,
 *
 *   // Internal role-visibility enforcement flags
 *   excludeSystemRoles: boolean,
 *   excludeRootRoles: boolean,
 *   excludeAdminRoles: boolean
 * }>}
 */
const evaluateRoleVisibilityAccessControl = async (user) => {
  try {
    const { permissions, isRoot, roleName } =
      await resolveUserPermissionContext(user);
    
    const isAdmin = roleName === 'admin';
    const isSystem = roleName === 'system';
    
    const canViewAllStatuses =
      isRoot || permissions.includes(ROLE_CONSTANTS.PERMISSIONS.VIEW_ALL_ROLES);
    
    const canViewInactiveRoles =
      canViewAllStatuses ||
      permissions.includes(ROLE_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_ROLES);
    
    const canQueryRoleHierarchy =
      isRoot || permissions.includes(ROLE_CONSTANTS.PERMISSIONS.MANAGE_ROLES);
    
    return {
      canViewAllStatuses,
      canViewInactiveRoles,
      canQueryRoleHierarchy,
      
      // ROLE VISIBILITY POLICY FLAGS
      excludeSystemRoles: !isRoot && !isSystem,
      excludeRootRoles: !isRoot,
      excludeAdminRoles: !isRoot && !isAdmin,
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
 * Translates resolved role-visibility policy into repository-safe filters.
 *
 * This function acts as a boundary adapter between:
 * - business-level visibility decisions, and
 * - repository-level query constraints.
 *
 * IMPORTANT:
 * - This function does NOT validate or sanitize client input.
 * - It ONLY injects, overrides, or removes filters based on
 *   pre-evaluated visibility policy.
 * - All injected flags are INTERNAL and MUST NOT originate
 *   from request payloads.
 *
 * Responsibilities:
 * - Enforce ACTIVE-only visibility when inactive roles are not permitted
 * - Prevent hierarchy traversal when not allowed
 * - Exclude privileged system roles (system / root / admin)
 *   based on caller visibility scope
 *
 * @param {{
 *   statusIds?: string[],
 *   status_id?: string,
 *   _activeStatusId?: string,
 *   parent_role_id?: string,
 *   hierarchy_level?: number,
 *   role_group?: string,
 *   is_active?: boolean,
 *   keyword?: string,
 *
 *    // INTERNAL (BUSINESS-INJECTED)
 *   _excludeSystemRoles?: boolean,
 *   _excludeRootRoles?: boolean,
 *   _excludeAdminRoles?: boolean,
 *   _maxHierarchyLevel?: number,
 *
 *   [key: string]: any
 * }} filters
 * Incoming role query filters (may include client-provided fields)
 *
 * @param {Object} acl
 *   Resolved role visibility policy (business-derived, trusted)
 *
 * @param {boolean} acl.canViewInactiveRoles
 *   Whether inactive roles may be queried
 *
 * @param {boolean} acl.canQueryRoleHierarchy
 *   Whether hierarchy-related fields may be queried
 *
 * @param {boolean} acl.excludeSystemRoles
 *   Whether system roles must be hidden
 *
 * @param {boolean} acl.excludeRootRoles
 *   Whether root roles must be hidden
 *
 * @param {boolean} acl.excludeAdminRoles
 *   Whether admin roles must be hidden
 *
 * @param {string} activeStatusId
 *   Status ID representing ACTIVE roles (enforced fallback)
 *
 * @returns {Object}
 *   Adjusted filter object safe for repository consumption
 */
const applyRoleVisibilityRules = (filters, acl, activeStatusId) => {
  const adjusted = { ...filters };
  
  // 1. Status enforcement
  if (!acl.canViewInactiveRoles) {
    delete adjusted.statusIds;
    delete adjusted.status_id;
    adjusted._activeStatusId = activeStatusId;
  }
  
  // 2. Hierarchy protection
  if (!acl.canQueryRoleHierarchy) {
    delete adjusted.parent_role_id;
    delete adjusted.hierarchy_level;
  }
  
  // 3. ROLE VISIBILITY ENFORCEMENT (NEW)
  if (acl.excludeSystemRoles) {
    adjusted._excludeSystemRoles = true;
  }
  
  if (acl.excludeRootRoles) {
    adjusted._excludeRootRoles = true;
  }
  
  if (acl.excludeAdminRoles) {
    adjusted._excludeAdminRoles = true;
  }
  
  return adjusted;
};

module.exports = {
  evaluateRoleVisibilityAccessControl,
  applyRoleVisibilityRules,
};
