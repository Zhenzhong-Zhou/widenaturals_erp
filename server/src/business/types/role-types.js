/**
 * @file role-types.js
 * @description JSDoc type definitions for the role domain.
 */

'use strict';

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} RoleVisibilityAcl
 * @property {boolean} canViewInactiveRoles
 * @property {boolean} canQueryRoleHierarchy
 * @property {boolean} excludeSystemRoles
 * @property {boolean} excludeRootRoles
 * @property {boolean} excludeAdminRoles
 */
