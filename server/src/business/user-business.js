const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const { USER_CONSTANTS } = require('../utils/constants/domain/user-constants');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');

/**
 * Business: Determine whether the requester is allowed to create users
 * and which privilege tiers they may assign.
 *
 * This function evaluates USER CREATION AUTHORITY ONLY.
 * It does NOT validate input shape or perform persistence logic.
 *
 * Root users implicitly bypass all creation restrictions.
 *
 * @param {Object} user - Authenticated user context.
 *
 * @returns {Promise<{
 *   canCreateUsers: boolean,
 *   canCreateAdminUsers: boolean,
 *   canCreateSystemUsers: boolean,
 *   canCreateRootUsers: boolean
 * }>}
 */
const evaluateUserCreationAccessControl = async (user) => {
  try {
    // ------------------------------------------------------------
    // Bootstrap bypass (explicit and auditable)
    // ------------------------------------------------------------
    if (user?.isBootstrap === true) {
      return {
        canCreateUsers: true,
        canCreateAdminUsers: true,
        canCreateSystemUsers: true,
        canCreateRootUsers: true,
      };
    }
    
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canCreateUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.CREATE_USERS);
    
    const canCreateAdminUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.CREATE_ADMIN_USERS);
    
    const canCreateSystemUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.CREATE_SYSTEM_USERS);
    
    const canCreateRootUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.CREATE_ROOT_USERS);
    
    return {
      canCreateUsers,
      canCreateAdminUsers,
      canCreateSystemUsers,
      canCreateRootUsers,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate user creation access control',
      {
        context: 'user-business/evaluateUserCreationAccessControl',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate user creation access control.',
      { details: err.message }
    );
  }
};

/**
 * Business: Determine which categories of users the requester
 * is allowed to view in user list pages, directory views, or lookup dropdowns.
 *
 * This function resolves USER VISIBILITY AUTHORITY ONLY.
 * It does NOT inspect filters, modify data, or apply query logic.
 *
 * Visibility categories covered:
 *   ✔ Regular (active) users
 *   ✔ Inactive users
 *   ✔ System / automation users
 *   ✔ Root-level users
 *
 * Permission semantics:
 *
 *   - VIEW_SYSTEM_USERS
 *       Allows viewing system / automation users.
 *
 *   - VIEW_ROOT_USERS
 *       Allows viewing root-level users.
 *
 *   - VIEW_INACTIVE_USERS
 *       Allows viewing inactive users.
 *
 *   - VIEW_USERS_ALL_VISIBILITY
 *       VIEW ALL USERS (FULL VISIBILITY OVERRIDE).
 *
 *       This permission implicitly allows viewing:
 *         • active users
 *         • inactive users
 *         • system / automation users
 *         • root-level users
 *
 *       It supersedes all other user visibility permissions.
 *
 * Root users (`isRoot === true`) implicitly bypass all user visibility restrictions.
 *
 * Derived rule:
 *   - ACTIVE-only visibility is enforced by default.
 *   - `enforceActiveOnly` is true ONLY when the requester cannot view inactive users
 *     and does not have full user visibility.
 *
 * @param {Object} user - Authenticated user context.
 *
 * @returns {Promise<{
 *   canViewSystemUsers: boolean,
 *   canViewRootUsers: boolean,
 *   canViewAllStatuses: boolean,
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

    // Full visibility override:
    // implies inactive + system + root visibility
    const canViewAllUsers =
      isRoot ||
      permissions.includes(
        USER_CONSTANTS.PERMISSIONS.VIEW_USERS_ALL_VISIBILITY
      );
    
    // Inactive users are visible either via explicit permission
    // or via full visibility override
    const canViewAllStatuses =
      canViewAllUsers ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_USERS);

    // Derived rule:
    // Default to ACTIVE-only visibility unless explicitly permitted
    // to view inactive users or granted full visibility override
    const enforceActiveOnly = !canViewAllStatuses && !canViewAllUsers;

    return {
      canViewSystemUsers,
      canViewRootUsers,
      canViewAllStatuses,
      canViewAllUsers,
      enforceActiveOnly,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate user visibility access control',
      {
        context: 'user-business/evaluateUserVisibilityAccessControl',
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user visibility access control.',
      { details: err.message }
    );
  }
};

/**
 * Business: applyUserListVisibilityRules
 *
 * Adjust user list query filters based on evaluated visibility access control.
 *
 * Responsibility:
 * - Translate ACL decisions into repository-consumable filter flags
 * - Enforce ACTIVE-only visibility for non-privileged users (default)
 * - Apply widened visibility when explicitly granted by ACL
 *
 * Enforcement model:
 * - SQL filtering is the PRIMARY enforcement mechanism
 * - Row slicing is defensive only
 *
 * This function MUST:
 * - Set includeSystemUsers / includeRootUsers explicitly
 * - Set enforceActiveOnly + activeStatusId when required
 * - Remove conflicting status filters when ACTIVE-only enforcement applies
 *
 * This function MUST NOT:
 * - Perform row-level filtering
 * - Evaluate permissions or infer privilege from roles
 * - Bypass repository-level visibility constraints
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
    adjusted.canViewAllUsers = true;
    adjusted.includeSystemUsers = true;
    adjusted.includeRootUsers = true;
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
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
  if (access.enforceActiveOnly && userRow.status_name !== 'active') {
    return null;
  }

  return userRow;
};

/**
 * Business: Determine whether the requester can view the target user's profile.
 *
 * Visibility rules:
 *  - Users can always view their own profile
 *  - Root users can view all profiles
 *  - Users with explicit permission can view others' profiles
 *
 * This function resolves visibility authority only.
 * It does NOT fetch data or perform slicing.
 *
 * @param {Object} requester - Authenticated user context
 * @param {string} targetUserId - Target user UUID
 * @returns {Promise<{
 *   isSelf: boolean,
 *   canViewProfile: boolean
 * }>}
 */
const evaluateUserProfileAccessControl = async (requester, targetUserId) => {
  const isSelf = requester?.id === targetUserId;

  const { permissions, isRoot } = await resolveUserPermissionContext(requester);

  return {
    isSelf,
    canViewProfile:
      isSelf ||
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_ANY_USER_PROFILE),
  };
};

/**
 * Blocks profile visibility entirely if not permitted.
 *
 * @param {UserProfileRow} row
 * @param {{ canViewProfile: boolean }} access
 * @returns {UserProfileRow|null}
 */
const sliceUserProfileForUser = (row, access) => {
  if (!access.canViewProfile) return null;
  return row;
};

/**
 * Business: Determine whether the requester can view role information
 * on a user profile.
 *
 * Visibility rules:
 *  - Users can always view their own role
 *  - Root users can view all roles
 *  - Users with explicit permission can view others' roles
 *
 * @param {Object} requester - Authenticated user context
 * @param {{ isSelf: boolean }} profileAccess
 * @returns {Promise<{
 *   canViewRole: boolean
 * }>}
 */
const evaluateUserRoleViewAccessControl = async (requester, profileAccess) => {
  const { permissions, isRoot } = await resolveUserPermissionContext(requester);

  return {
    canViewRole:
      profileAccess.isSelf ||
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_USER_ROLES),
  };
};

/**
 * Applies role visibility rules.
 *
 * @param {UserProfileRow} row
 * @param {{ canViewRole: boolean }} access
 * @returns {UserProfileRow}
 */
const sliceUserRoleForUser = (row, access) => {
  if (!access.canViewRole) {
    return {
      ...row,
      role_id: null,
      role_name: null,
      role_group: null,
      hierarchy_level: null,
      permissions: null,
    };
  }
  return row;
};

/**
 * Evaluates which lookup search dimensions are available to the user
 * when performing user lookup queries (e.g. dropdowns, autocomplete).
 *
 * This function determines **query capabilities**, not row visibility.
 * It does NOT decide which users are visible — only which metadata
 * fields are allowed to participate in keyword search.
 *
 * ### Responsibilities
 * - Resolve permission-based search capabilities
 * - Control whether role or status metadata may be searched
 * - Prevent unauthorized JOIN expansion in lookup queries
 *
 * ### Notes
 * - These flags are intended for repository query shaping only
 * - They must be resolved by the business / ACL layer
 * - They should never be derived from client input
 *
 * ### Derived Capabilities
 * - `canSearchRole`   → enables role name search (roles JOIN)
 * - `canSearchStatus` → enables status name search (statuses JOIN)
 *
 * @param {Object} user
 *   Authenticated user context
 *
 * @returns {Promise<{
 *   canSearchRole: boolean,
 *   canSearchStatus: boolean
 * }>}
 *
 * @throws {AppError}
 *   If permission context resolution fails
 */
const evaluateUserLookupSearchCapabilities = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canSearchRole =
      isRoot ||
      permissions.includes(
        USER_CONSTANTS.PERMISSIONS.SEARCH_USERS_BY_ROLE
      );
    
    const canSearchStatus =
      isRoot ||
      permissions.includes(
        USER_CONSTANTS.PERMISSIONS.SEARCH_USERS_BY_STATUS
      );
    
    return {
      canSearchRole,
      canSearchStatus,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate user lookup search capabilities',
      {
        context: 'user-business/evaluateUserLookupSearchCapabilities',
        userId: user?.id,
      }
    );
    
    throw AppError.businessError(
      'Unable to evaluate user lookup search capabilities.',
      { details: err.message }
    );
  }
};

/**
 * Business: applyUserLookupVisibilityRules
 *
 * Purpose:
 * - Translate evaluated ACL decisions into repository-safe lookup filters
 * - Enforce conservative visibility rules for USER LOOKUPS
 *
 * Lookup-specific behavior:
 * - Lookups are intentionally MORE restrictive than full user lists
 * - Designed for dropdowns, autocomplete, and assignment selectors
 *
 * Enforced rules (in order of precedence):
 * 1. Full visibility override:
 *    - Includes system users
 *    - Includes root users
 *    - Disables ACTIVE-only enforcement
 *
 * 2. Default visibility (non-privileged users):
 *    - ACTIVE users only
 *    - System users hidden
 *    - Root users hidden
 *
 * 3. Privileged visibility (partial):
 *    - Inactive users allowed ONLY when explicitly permitted by ACL
 *    - System/root users still hidden unless full override
 *
 * IMPORTANT:
 * - This function does NOT evaluate permissions.
 * - It assumes ACL has already been resolved by
 *   `evaluateUserVisibilityAccessControl`.
 * - All enforcement happens at the SQL/repository level.
 *
 * @param {Object} filters
 *   - Original lookup filters provided by the caller.
 *
 * @param {Object} acl
 *   - Result of `evaluateUserVisibilityAccessControl()`.
 *
 * @param {string} activeStatusId
 *   - Status ID representing the ACTIVE user state.
 *   - Must be resolved by the service layer and passed explicitly.
 *
 * @returns {Object}
 *   - Repository-safe filters suitable for user lookup queries.
 */
const applyUserLookupVisibilityRules = (filters, acl, activeStatusId) => {
  const adjusted = { ...filters };
  
  // ---------------------------------------------------------
  // Full visibility override
  // ---------------------------------------------------------
  if (acl.canViewAllUsers) {
    adjusted.includeSystemUsers = true;
    adjusted.includeRootUsers = true;
    delete adjusted.enforceActiveOnly;
    delete adjusted.activeStatusId;
    return adjusted;
  }
  
  // ---------------------------------------------------------
  // ACTIVE-only enforcement (default)
  // ---------------------------------------------------------
  if (!acl.canViewAllUsers) {
    adjusted.enforceActiveOnly = true;
    adjusted.activeStatusId = activeStatusId;
    delete adjusted.statusIds;
  }
  
  // ---------------------------------------------------------
  // System users — never shown unless full override
  // ---------------------------------------------------------
  adjusted.includeSystemUsers = false;
  
  // ---------------------------------------------------------
  // Root users — never shown unless full override
  // ---------------------------------------------------------
  adjusted.includeRootUsers = false;
  
  return adjusted;
};

/**
 * Enrich a User lookup row with an explicit active-state flag.
 *
 * Purpose:
 * - Expose a simple boolean (`isActive`) for UI rendering logic
 * - Allow user lookup UIs to visually differentiate active vs inactive users
 *   (e.g. disabled options, muted styling, warning icons)
 *
 * IMPORTANT:
 * - This function does NOT change visibility rules.
 * - Inactive users must already be permitted by ACL and SQL filters.
 * - This is a pure UI-enrichment helper.
 *
 * Usage guidance:
 * - Attach `isActive` ONLY when inactive users may appear in the result set
 *   (e.g. admin / manager views).
 * - Omit this enrichment for active-only lookups to keep payload minimal.
 *
 * @param {object} row - A User lookup row from the repository.
 *   Expected to include `status_id`.
 *
 * @param {string} activeStatusId - Status ID representing the ACTIVE user state.
 *
 * @returns {object} User lookup row with:
 *   - `isActive: boolean`
 *
 * @throws {AppError} If input validation fails.
 */
const enrichUserLookupWithActiveFlag = (row, activeStatusId) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichUserLookupWithActiveFlag] Invalid `row`.'
    );
  }
  
  if (typeof activeStatusId !== 'string' || !activeStatusId) {
    throw AppError.validationError(
      '[enrichUserLookupWithActiveFlag] Missing or invalid activeStatusId.'
    );
  }
  
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
  };
};

module.exports = {
  evaluateUserCreationAccessControl,
  evaluateUserVisibilityAccessControl,
  applyUserListVisibilityRules,
  sliceUserForUser,
  evaluateUserProfileAccessControl,
  sliceUserProfileForUser,
  evaluateUserRoleViewAccessControl,
  sliceUserRoleForUser,
  evaluateUserLookupSearchCapabilities,
  applyUserLookupVisibilityRules,
  enrichUserLookupWithActiveFlag,
};
