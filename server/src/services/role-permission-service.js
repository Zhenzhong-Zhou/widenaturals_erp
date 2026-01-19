const { tryCacheRead, tryCacheWrite } = require('../utils/cache-utils');
const { getStatusId } = require('../config/status-cache');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const {
  getAccessibleOrderCategoriesFromPermissions,
} = require('../utils/permission-utils');
const AppError = require('../utils/AppError');
const {
  ORDER_CATEGORIES,
} = require('../utils/constants/domain/order-type-constants');

/**
 * Fetches permissions assigned to a role.
 *
 * This function performs a cache-first lookup with a
 * database fallback, ensuring authentication remains
 * reliable even if caching infrastructure is unavailable.
 *
 * Guarantees:
 * - Redis is OPTIONAL and treated as a best-effort optimization
 * - The database is the source of truth
 * - Cache read/write failures NEVER block authentication
 * - Returned permissions are normalized and validated
 *
 * Failure semantics:
 * - Throws an authorization error if the role does not exist
 *   or has no active permissions
 *
 * @param {string} roleId
 *   Role identifier used to resolve permissions
 *
 * @returns {Promise<{
 *   roleName: string,
 *   permissions: string[]
 * }>}
 *   Normalized role permission payload
 */
const fetchPermissions = async (roleId) => {
  // Cache key versioned for safe schema evolution
  const cacheKey = `role_permissions:v1:${roleId}`;
  
  /* ----------------------------------------
   * Cache-first lookup (BEST-EFFORT)
   * -------------------------------------- */
  const cached = await tryCacheRead(cacheKey);
  if (cached?.permissions) {
    return cached;
  }
  
  /* ----------------------------------------
   * DB fallback (SOURCE OF TRUTH)
   * -------------------------------------- */
  const activeStatusId = getStatusId('general_active');
  const result = await getRolePermissionsByRoleId(roleId, activeStatusId);
  
  if (!result) {
    throw AppError.authorizationError(
      'Role permissions not found.',
      { roleId }
    );
  }
  
  // Defensive normalization (ultra-safe)
  const permissions = Array.isArray(result.permissions)
    ? result.permissions
    : [];
  
  if (!permissions.length) {
    throw AppError.authorizationError(
      'User has no assigned permissions.',
      { roleId }
    );
  }
  
  const normalized = {
    roleName: result.role_name,
    permissions,
  };
  
  // Best-effort cache write
  await tryCacheWrite(cacheKey, normalized, 3600);
  
  return normalized;
};

/**
 * Determines if permission list includes root access.
 *
 * @param {string[]} permissions
 * @returns {boolean}
 */
const hasRootAccessSync = (permissions = []) =>
  Array.isArray(permissions) && permissions.includes('root_access');

/**
 * Resolves the authorization context for an authenticated user.
 *
 * This function hydrates permission-related runtime data
 * derived from the user's assigned role.
 *
 * It acts as a shared foundation for:
 * - ACL evaluation
 * - Business-level visibility rules
 * - Permission-based feature gating
 *
 * IMPORTANT:
 * - This function does NOT enforce access control.
 * - It ONLY resolves identity and permission context.
 *
 * @param {{ id?: string, role: string }} user
 *   Authenticated user context containing a role identifier
 *
 * @returns {Promise<{
 *   roleName: string,
 *   permissions: string[],
 *   isRoot: boolean
 * }>}
 *   Normalized permission context for downstream logic
 */
const resolveUserPermissionContext = async (user) => {
  if (!user?.role) {
    throw AppError.authorizationError(
      'User role is required for permission check.'
    );
  }
  
  const { permissions, roleName } = await fetchPermissions(user.role);
  
  return {
    roleName,
    permissions,
    isRoot: hasRootAccessSync(permissions),
  };
};

/**
 * Check whether user satisfies permission requirements.
 *
 * @param {{ id: string, role: string }} user
 * @param {string[]} requiredPermissions
 * @param {{ requireAll?: boolean, allowRootAccess?: boolean }} options
 * @returns {Promise<boolean>}
 */
const checkPermissions = async (
  user,
  requiredPermissions = [],
  { requireAll = false, allowRootAccess = true } = {}
) => {
  if (!user?.id || !user.role) return false;
  
  const { permissions, isRoot } =
    await resolveUserPermissionContext(user);
  
  if (allowRootAccess && isRoot) {
    return true;
  }
  
  return requireAll
    ? requiredPermissions.every((p) => permissions.includes(p))
    : requiredPermissions.some((p) => permissions.includes(p));
};

/**
 * Resolve accessible order categories for a user/action.
 *
 * @param {{ id: string, role: string }} user
 * @param {{ action?: 'VIEW'|'CREATE'|'UPDATE'|'DELETE' }} opts
 * @returns {Promise<{ isRoot: boolean, accessibleCategories: string[], action: string }>}
 */
const resolveOrderAccessContext = async (
  user,
  { action = 'VIEW' } = {}
) => {
  const { permissions, isRoot } =
    await resolveUserPermissionContext(user);
  
  if (isRoot) {
    return {
      isRoot,
      accessibleCategories: [...ORDER_CATEGORIES],
      action,
    };
  }
  
  const accessibleCategories =
    getAccessibleOrderCategoriesFromPermissions(permissions, { action });
  
  if (!accessibleCategories.length) {
    throw AppError.authorizationError(
      `You do not have permission to ${action.toLowerCase()} any order types`
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
