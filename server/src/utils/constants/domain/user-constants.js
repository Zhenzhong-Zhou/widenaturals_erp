const USER_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // User creation & provisioning (mutating actions)
    // -------------------------------------------------

    CREATE_USERS: 'create_users',
    // Allows creating standard (non-system, non-root) users

    CREATE_ADMIN_USERS: 'create_admin_users',
    // Allows creating admin-level users (excluding root)

    CREATE_SYSTEM_USERS: 'create_system_users',
    // Allows creating system / automation users (is_system = true)

    CREATE_ROOT_USERS: 'create_root_users',
    // Allows creating root-level users (highest privilege accounts)

    // -------------------------------------------------
    // Visibility controls (read-only access)
    // -------------------------------------------------

    VIEW_SYSTEM_USERS: 'view_system_users',
    // Allows viewing system / automation users (is_system = true)

    VIEW_ROOT_USERS: 'view_root_users',
    // Allows viewing root-level users (roles with root-level access)

    VIEW_INACTIVE_USERS: 'view_inactive_users',
    // Allows viewing users in inactive / disabled states

    VIEW_USERS_ALL_VISIBILITY: 'view_all_users_visibility',
    // Full visibility override (read-only):
    // Can view all users regardless of category or status

    VIEW_ANY_USER_PROFILE: 'view_any_user_profile',
    // Allows viewing other users' profiles by ID
    // Without this, users may only view their own profile

    VIEW_USER_ROLES: 'view_user_roles',
    // Allows viewing roles and role metadata of other users

    VIEW_USER_AVATARS: 'view_user_avatars',
    // Allows viewing avatars of other users

    // -------------------------------------------------
    // Lookup & search capabilities (read-only, scoped)
    // -------------------------------------------------

    SEARCH_USERS_BY_ROLE: 'search_users_by_role',
    // Allows keyword search against role name in user lookups
    // Enables JOIN on roles table for lookup queries only

    SEARCH_USERS_BY_STATUS: 'search_users_by_status',
    // Allows keyword search against status name in user lookups
    // Enables JOIN on statuses table for lookup queries only

    // -------------------------------------------------
    // Password & Credential Management
    // -------------------------------------------------

    CHANGE_SELF_PASSWORD: 'change_self_password',
    // Allows authenticated user to change their own password

    RESET_ANY_USER_PASSWORD: 'reset_any_user_password',
    // Allows resetting another user's password (admin-level action)

    FORCE_RESET_ANY_USER_PASSWORD: 'force_reset_any_user_password',
    // Allows forcing password reset flag (require change on next login)

    // -------------------------------------------------
    // Administrative capabilities (mutating actions)
    // -------------------------------------------------

    MANAGE_USERS: 'manage_users',
    // Create, update, or deactivate users

    RESET_USER_CREDENTIALS: 'reset_user_credentials',
    // Reset passwords, unlock accounts, or recover access

    ASSIGN_USER_ROLES: 'assign_user_roles',
    // Assign or change user roles

    ADMIN_OVERRIDE_USER_FILTERS: 'admin_override_user_filters',
    // Administrative override for visibility and filtering constraints
    // Intended for audit, support, or investigation tooling only
  },
};

module.exports = {
  USER_CONSTANTS,
};
