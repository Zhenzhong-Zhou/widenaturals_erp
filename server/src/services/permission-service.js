/**
 * @file permission-service.js
 * @description Utility service for resolving user permissions and access context.
 *
 * Exports:
 *   - fetchPermissions              – fetches role permissions with cache-first strategy
 *   - hasRootAccessSync             – checks if a permission set includes root access
 *   - resolveUserPermissionContext  – resolves full permission context for a user
 *   - checkPermissions              – checks if a user holds required permissions
 *   - resolveOrderAccessContext     – resolves order category access for a user
 *
 * No logging — permission resolution is a utility concern, not a business operation.
 * AppErrors are thrown directly — callers are responsible for handling them.
 */

'use strict';

const { tryCacheRead, tryCacheWrite }    = require('../utils/cache-utils');
const { getStatusId }                    = require('../config/status-cache');
const { getRolePermissionsByRoleId }     = require('../repositories/role-permission-repository');
const {
  getAccessibleOrderCategoriesFromPermissions,
}                                        = require('../utils/permission-utils');
const AppError                           = require('../utils/AppError');
const { ORDER_CATEGORIES }               = require('../utils/constants/domain/order-type-constants');

/**
 * Fetches role permissions using a cache-first strategy.
 *
 * Attempts a cache read first. Falls back to the DB on miss, normalizes
 * the result, and writes it back to cache with a 1-hour TTL.
 *
 * @param {string} roleId - UUID of the role to fetch permissions for.
 * @returns {Promise<{ roleName: string, permissions: string[] }>}
 *
 * @throws {AppError} `authorizationError` – role permissions not found or empty.
 */
const fetchPermissions = async (roleId) => {
  // Cache key versioned for safe schema evolution.
  const cacheKey = `role_permissions:v1:${roleId}`;
  
  // Cache-first lookup — best-effort, not guaranteed.
  const cached = await tryCacheRead(cacheKey);
  if (cached?.permissions) return cached;
  
  // DB fallback — source of truth.
  const activeStatusId = getStatusId('general_active');
  const result         = await getRolePermissionsByRoleId(roleId, activeStatusId);
  
  if (!result) {
    throw AppError.authorizationError('Role permissions not found.');
  }
  
  const permissions = Array.isArray(result.permissions) ? result.permissions : [];
  
  if (!permissions.length) {
    throw AppError.authorizationError('User has no assigned permissions.');
  }
  
  const normalized = {
    roleName:    result.role_name,
    permissions,
  };
  
  // Best-effort cache write — failure is acceptable here.
  await tryCacheWrite(cacheKey, normalized, 3600);
  
  return normalized;
};

/**
 * Returns `true` if the permission set includes `'root_access'`.
 *
 * @param {string[]} [permissions=[]]
 * @returns {boolean}
 */
const hasRootAccessSync = (permissions = []) =>
  permissions.includes('root_access');

/**
 * Resolves the full permission context for a user including root status.
 *
 * @param {Object} user          - Authenticated user.
 * @param {string} user.role     - Role UUID.
 * @returns {Promise<{ roleName: string, permissions: string[], isRoot: boolean }>}
 *
 * @throws {AppError} `authorizationError` – user has no role or role has no permissions.
 */
const resolveUserPermissionContext = async (user) => {
  if (!user?.role) {
    throw AppError.authorizationError('User role is required for permission check.');
  }
  
  const { permissions, roleName } = await fetchPermissions(user.role);
  
  return {
    roleName,
    permissions,
    isRoot: hasRootAccessSync(permissions),
  };
};

/**
 * Checks whether a user holds the required permissions.
 *
 * Root users bypass permission checks when `allowRootAccess` is true.
 * Returns `false` if the user is missing `id` or `role`.
 *
 * @param {Object}   user                         - Authenticated user.
 * @param {string[]} [requiredPermissions=[]]      - Permissions to check.
 * @param {Object}   [options={}]
 * @param {boolean}  [options.requireAll=false]    - If true, all permissions must be present.
 * @param {boolean}  [options.allowRootAccess=true] - If true, root users always pass.
 * @returns {Promise<boolean>}
 */
const checkPermissions = async (
  user,
  requiredPermissions = [],
  { requireAll = false, allowRootAccess = true } = {}
) => {
  if (!user?.id || !user.role) return false;
  
  const { permissions, isRoot } = await resolveUserPermissionContext(user);
  
  if (allowRootAccess && isRoot) return true;
  
  return requireAll
    ? requiredPermissions.every((p) => permissions.includes(p))
    : requiredPermissions.some((p) => permissions.includes(p));
};

/**
 * Resolves the order categories accessible to a user for a given action.
 *
 * Root users receive access to all order categories.
 *
 * @param {Object} user              - Authenticated user.
 * @param {Object} [options={}]
 * @param {string} [options.action='VIEW'] - Action to evaluate (`'VIEW'`, `'CREATE'`, etc.).
 * @returns {Promise<{ isRoot: boolean, accessibleCategories: string[], action: string }>}
 *
 * @throws {AppError} `authorizationError` – user has no access to any order category for the action.
 */
const resolveOrderAccessContext = async (user, { action = 'VIEW' } = {}) => {
  const { permissions, isRoot } = await resolveUserPermissionContext(user);
  
  if (isRoot) {
    return {
      isRoot,
      accessibleCategories: [...ORDER_CATEGORIES],
      action,
    };
  }
  
  const accessibleCategories = getAccessibleOrderCategoriesFromPermissions(permissions, { action });
  
  if (!accessibleCategories.length) {
    throw AppError.authorizationError(
      `You do not have permission to ${action.toLowerCase()} any order types.`
    );
  }
  
  return { isRoot, accessibleCategories, action };
};

module.exports = {
  fetchPermissions,
  hasRootAccessSync,
  resolveUserPermissionContext,
  checkPermissions,
  resolveOrderAccessContext,
};
