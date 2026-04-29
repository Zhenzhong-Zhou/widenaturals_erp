/**
 * @file role-classifier.js
 * @description Pure utility for classifying roles into tiers based on role name.
 * Used to derive access flags without hitting the database.
 */

'use strict';

/**
 * Frozen map of role name strings grouped by tier.
 * Used by `classifyRole` to determine role-level access flags.
 */
const ROLE_TIERS = Object.freeze({
  ROOT: ['root', 'root_admin', 'super_admin'],
  ADMIN: ['admin'],
  SYSTEM: ['system', 'automation'],
});

/**
 * Classifies a role object into boolean tier flags.
 *
 * `isAdminRole` is true for both admin and root roles — root implies admin.
 * Returns all-false flags if `role` is absent or has a non-string `name`.
 *
 * @param {{ name: string }} [role={}] - Role object with a `name` property.
 * @returns {{ isRootRole: boolean, isAdminRole: boolean, isSystemRole: boolean }}
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
