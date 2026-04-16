/**
 * @file user-business.js
 * @description Domain business logic for user access control evaluation,
 * visibility rule application, and row-level access slicing. Covers user
 * creation, list visibility, profile access, role visibility, lookup search
 * capabilities, and lookup visibility.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { USER_CONSTANTS } = require('../utils/constants/domain/user-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { getStatusId } = require('../config/status-cache');
const { enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'user-business';

/**
 * Resolves which user creation capabilities the requesting user holds.
 *
 * Bootstrap users bypass permission resolution entirely and receive full
 * creation access — this path is explicit and auditable.
 *
 * @param {AuthUser | SystemActor} user - Authenticated user or system actor.
 * @returns {Promise<UserCreationAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateUserCreationAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateUserCreationAccessControl`;

  try {
    // Bootstrap bypass — explicit and auditable.
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
      isRoot || permissions.includes(USER_CONSTANTS.PERMISSIONS.CREATE_USERS);

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
    logSystemException(err, 'Failed to evaluate user creation access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate user creation access control.'
    );
  }
};

/**
 * Resolves which user visibility capabilities the requesting user holds.
 *
 * `canViewAllUsers` is a full override — it implies inactive, system, and root
 * user visibility. `enforceActiveOnly` is derived: true when neither
 * `canViewAllStatuses` nor `canViewAllUsers` is granted.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<UserVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateUserVisibilityAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateUserVisibilityAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewSystemUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_SYSTEM_USERS);

    const canViewRootUsers =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_ROOT_USERS);

    // Full visibility override — implies inactive, system, and root visibility.
    const canViewAllUsers =
      isRoot ||
      permissions.includes(
        USER_CONSTANTS.PERMISSIONS.VIEW_USERS_ALL_VISIBILITY
      );

    // Inactive users visible via explicit permission or full override.
    const canViewAllStatuses =
      canViewAllUsers ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_INACTIVE_USERS);

    // Active-only enforcement is the default — lifted only when the user can
    // view all statuses (which already incorporates canViewAllUsers).
    const enforceActiveOnly = !canViewAllStatuses;

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
        context,
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user visibility access control.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a user list filter object.
 *
 * Full override grants system and root user visibility and removes active-only
 * enforcement. Otherwise active-only is enforced by default, and system/root
 * visibility is set from the ACL flags.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {UserVisibilityAcl} acl - Resolved ACL from `evaluateUserVisibilityAccessControl`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
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
  // 2. Status visibility (active-only enforced unless permitted)
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
 * Filters a single user row based on list-level visibility access.
 * Returns `null` if the user should not appear in the result set.
 *
 * Root user filtering is defensive only — SQL already excludes root users
 * when the caller lacks `canViewRootUsers`.
 *
 * @param {UserRow} userRow - Raw user row from the repository.
 * @param {UserVisibilityAcl} access - Resolved ACL from `evaluateUserVisibilityAccessControl`.
 * @returns {UserRow | null}
 */
const sliceUserForUser = (userRow, access) => {
  // Full override → allow everything.
  if (access.canViewAllUsers) return userRow;

  // Defensive root-user guard — SQL should already have excluded these.
  if (!access.canViewRootUsers) return null;

  // Active-only enforcement.
  if (access.enforceActiveOnly && userRow.status_name !== 'active') {
    return null;
  }

  return userRow;
};

/**
 * Resolves whether the requesting user can view a specific user's profile.
 *
 * @param {AuthUser} requester - Authenticated user making the request.
 * @param {string} targetUserId - UUID of the user whose profile is being accessed.
 * @returns {Promise<UserProfileAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateUserProfileAccessControl = async (requester, targetUserId) => {
  const context = `${CONTEXT}/evaluateUserProfileAccessControl`;

  try {
    const isSelf = requester?.id === targetUserId;
    const { permissions, isRoot } =
      await resolveUserPermissionContext(requester);

    return {
      isSelf,
      canViewProfile:
        isSelf ||
        isRoot ||
        permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_ANY_USER_PROFILE),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate user profile access control', {
      context,
      requesterId: requester?.id,
      targetUserId,
    });

    throw AppError.businessError(
      'Unable to evaluate user profile access control.'
    );
  }
};

/**
 * Filters a single user profile row based on profile-level access.
 * Returns `null` if the requester cannot view the profile.
 *
 * @param {UserRow} row - Raw user row from the repository.
 * @param {UserProfileAcl} access - Resolved ACL from `evaluateUserProfileAccessControl`.
 * @returns {UserRow | null}
 */
const sliceUserProfileForUser = (row, access) => {
  if (!access.canViewProfile) return null;
  return row;
};

/**
 * Resolves whether the requesting user can view role details on a user profile.
 *
 * @param {AuthUser} requester - Authenticated user making the request.
 * @param {UserProfileAcl} profileAccess - Resolved ACL from `evaluateUserProfileAccessControl`.
 * @returns {Promise<UserRoleAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateUserRoleViewAccessControl = async (requester, profileAccess) => {
  const context = `${CONTEXT}/evaluateUserRoleViewAccessControl`;

  try {
    const { permissions, isRoot } =
      await resolveUserPermissionContext(requester);

    return {
      canViewRole:
        profileAccess.isSelf ||
        isRoot ||
        permissions.includes(USER_CONSTANTS.PERMISSIONS.VIEW_USER_ROLES),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate user role view access control',
      {
        context,
        requesterId: requester?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user role view access control.'
    );
  }
};

/**
 * Nulls out role fields on a user row if the requester cannot view role details.
 *
 * @param {UserRow} row - Raw user row from the repository.
 * @param {UserRoleAcl} access - Resolved ACL from `evaluateUserRoleViewAccessControl`.
 * @returns {UserRow | UserRowRoleRedacted}
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
 * Resolves which keyword search capabilities the requesting user holds
 * for user lookup queries.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<UserLookupSearchAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateUserLookupSearchCapabilities = async (user) => {
  const context = `${CONTEXT}/evaluateUserLookupSearchCapabilities`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canSearchRole =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.SEARCH_USERS_BY_ROLE);

    const canSearchStatus =
      isRoot ||
      permissions.includes(USER_CONSTANTS.PERMISSIONS.SEARCH_USERS_BY_STATUS);

    return {
      canSearchRole,
      canSearchStatus,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate user lookup search capabilities',
      {
        context,
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate user lookup search capabilities.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a user lookup filter object.
 *
 * Full override grants system and root user visibility and removes active-only
 * enforcement. Without override, active-only is always enforced and system/root
 * users are always excluded from lookup results.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {UserVisibilityAcl} acl - Resolved ACL from `evaluateUserVisibilityAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
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
  // Active-only enforcement (always applied without full override)
  // ---------------------------------------------------------
  adjusted.enforceActiveOnly = true;
  adjusted.activeStatusId = activeStatusId;
  delete adjusted.statusIds;

  // System and root users are never shown in lookup without full override.
  adjusted.includeSystemUsers = false;
  adjusted.includeRootUsers = false;

  return adjusted;
};

/**
 * Enriches a user lookup row with a derived `isActive` boolean flag.
 *
 * @param {UserRow} row - Raw user row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {UserRow & { isActive: boolean }}
 */
const enrichUserLookupWithActiveFlag = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

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
