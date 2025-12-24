const USER_CONSTANTS = {
  PERMISSIONS: {
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
