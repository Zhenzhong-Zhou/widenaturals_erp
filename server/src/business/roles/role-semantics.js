/**
 * Role semantics resolver.
 *
 * Temporary implementation until role hierarchy (hierarchy_level / parent_role_id)
 * is fully enforced at the schema level.
 *
 * IMPORTANT:
 * - Root Admin is currently the highest-privilege role.
 * - Role meaning MUST be derived here, never inferred elsewhere.
 * - This module is the single source of truth for role classification.
 *
 * Future migration:
 * - Replace name-based checks with hierarchy_level or ancestry resolution
 * - Callers MUST NOT change
 */

const ROLE_TIERS = Object.freeze({
  ROOT: ['root', 'root_admin', 'super_admin'],
  ADMIN: ['admin'],
  SYSTEM: ['system', 'automation'],
});

/**
 * Classifies a role into semantic privilege categories.
 *
 * SECURITY NOTES:
 * - Classification is conservative by default
 * - Missing or invalid role data results in the lowest privilege
 * - Root roles always imply admin privileges
 *
 * @param {Object} role
 * @param {string} role.name - Role name (case-insensitive)
 *
 * @returns {{
 *   isRootRole: boolean,
 *   isAdminRole: boolean,
 *   isSystemRole: boolean
 * }}
 */
const classifyRole = (role = {}) => {
  if (!role || typeof role.name !== 'string') {
    return {
      isRootRole: false,
      isAdminRole: false,
      isSystemRole: false,
    };
  }

  const name = role.name.toLowerCase().trim();

  const isRootRole = ROLE_TIERS.ROOT.includes(name);
  const isAdminRole = isRootRole || ROLE_TIERS.ADMIN.includes(name);
  const isSystemRole = ROLE_TIERS.SYSTEM.includes(name);

  return {
    isRootRole,
    isAdminRole,
    isSystemRole,
  };
};

module.exports = {
  ROLE_TIERS,
  classifyRole,
};
