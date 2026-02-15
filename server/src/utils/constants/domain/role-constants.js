/**
 * Role permission constants.
 *
 * Roles are security primitives.
 * Permissions here must be conservative and explicit.
 */
const ROLE_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Role visibility (read-only)
    // -------------------------------------------------

    VIEW_ROLES: 'view_roles',
    // Allows viewing active, non-system roles only (default scope)

    VIEW_INACTIVE_ROLES: 'view_inactive_roles',
    // Allows viewing roles in inactive / disabled states

    VIEW_ALL_ROLES: 'view_all_roles',
    // Full visibility override:
    // - active roles
    // - inactive roles
    // - system / internal roles
    // Supersedes all other role visibility restrictions

    // -------------------------------------------------
    // Role hierarchy & metadata visibility
    // -------------------------------------------------

    VIEW_ROLE_HIERARCHY: 'view_role_hierarchy',
    // Allows inspecting role parent/child relationships
    // Enables use of parent_role_id / hierarchy_level filters

    VIEW_ROLE_METADATA: 'view_role_metadata',
    // Allows viewing extended role metadata
    // (descriptions, internal notes, system flags)

    // -------------------------------------------------
    // Role management (mutating actions)
    // -------------------------------------------------

    MANAGE_ROLES: 'manage_roles',
    // Create, update, deactivate roles
    // Modify role hierarchy
    // Assign permissions to roles

    ASSIGN_ROLE_PERMISSIONS: 'assign_role_permissions',
    // Assign or revoke permissions attached to roles

    // -------------------------------------------------
    // Administrative overrides
    // -------------------------------------------------

    ADMIN_OVERRIDE_ROLE_VISIBILITY: 'admin_override_role_visibility',
    // Allows bypassing role visibility constraints
    // Intended for audit, recovery, or internal tooling only
  },
};

module.exports = {
  ROLE_CONSTANTS,
};
