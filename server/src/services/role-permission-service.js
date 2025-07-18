const redisClient = require('../utils/redis-client');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const { getAccessibleOrderCategoriesFromPermissions } = require('../utils/permission-utils');

/**
 * Fetches the permissions and role name for a given role ID, with Redis caching.
 *
 * - Checks Redis first to avoid unnecessary DB calls
 * - Caches the result for 1 hour if fetched from the database
 * - Logs and throws on failure with context
 *
 * @param {string} roleId - The ID of the role to fetch.
 * @returns {Promise<{ roleName: string, permissions: string[] }>} Object containing role name and permissions.
 * @throws {AppError} If fetching from cache or database fails.
 */
const fetchPermissions = async (roleId) => {
  const cacheKey = `role_permissions:${roleId}`;
  
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    const { role_name, permissions } = await getRolePermissionsByRoleId(roleId);
    
    const dataToCache = { roleName: role_name, permissions };
    await redisClient.set(cacheKey, JSON.stringify(dataToCache), 'EX', 3600); // 1-hour TTL
    
    return dataToCache;
  } catch (error) {
    logSystemException(error, 'Failed to fetch role permissions', {
      context: 'permission-service/fetchPermissions',
      roleId,
    });
    
    throw AppError.serviceError('Failed to fetch permissions and role name.', {
      roleId,
      cause: error,
    });
  }
};

/**
 * Determines if the provided permission list includes root access.
 *
 * @param {string[]} permissions - List of user permissions.
 * @returns {boolean} True if the user has 'root_access'.
 */
const hasRootAccessSync = (permissions = []) =>
  Array.isArray(permissions) && permissions.includes('root_access');

/**
 * Resolves user permissions and whether the user has root access.
 *
 * @param {Object} user - The user object. Must include a valid `role`.
 * @returns {Promise<{ permissions: string[], isRoot: boolean }>}
 * @throws {AppError} If the user has no role or no permissions assigned.
 */
const resolveUserPermissionContext = async (user) => {
  if (!user?.role) {
    throw AppError.authorizationError('User role is required for permission check.');
  }
  
  const { permissions = [] } = await fetchPermissions(user.role);
  
  if (permissions.length === 0) {
    throw AppError.authorizationError('User has no assigned permissions.');
  }
  
  const isRoot = hasRootAccessSync(permissions);
  
  return { permissions, isRoot };
};

/**
 * Checks whether the user has the required permissions.
 *
 * - Supports `requireAll` to enforce a full permission set.
 * - Supports `allowRootAccess` to bypass checks if the user has `root_access`.
 *
 * @param {Object} user - The user object. Must include `id` and `role`.
 * @param {string[]} requiredPermissions - Array of required permission codes.
 * @param {Object} [options] - Additional options.
 * @param {boolean} [options.requireAll=false] - Require all permissions instead of any.
 * @param {boolean} [options.allowRootAccess=true] - Allow bypass for users with `root_access`.
 * @returns {Promise<boolean>} True if the user passes the permission check.
 */
const checkPermissions = async (
  user,
  requiredPermissions = [],
  { requireAll = false, allowRootAccess = true } = {}
) => {
  if (!user || !user.id || !user.role) return false;
  
  const { permissions, isRoot } = await resolveUserPermissionContext(user);
  
  // Root override
  if (allowRootAccess && isRoot) {
    return true;
  }

  return requireAll
    ? requiredPermissions.every((perm) => permissions.includes(perm))
    : requiredPermissions.some((perm) => permissions.includes(perm));
};

/**
 * Resolves access context for order-related features based on the user's permissions.
 *
 * - Determines whether the user has root-level access (`isRoot`)
 * - Derives which order categories the user is allowed to access (`accessibleCategories`)
 * - Throws if the user lacks access to all order categories (unless they have root access)
 *
 * @param {Object} user - The user object. Must include a valid `role` field.
 * @returns {Promise<{ isRoot: boolean, accessibleCategories: string[] }>}
 *          An object containing the root access flag and accessible order categories.
 * @throws {AppError} If the user has no permission to access any order types and is not a root user.
 */
const resolveOrderAccessContext = async (user) => {
  const { permissions, isRoot } = await resolveUserPermissionContext(user);
  const accessibleCategories = getAccessibleOrderCategoriesFromPermissions(permissions);
  
  if (!isRoot && accessibleCategories.length === 0) {
    throw AppError.authorizationError('You do not have permission to view any order types');
  }
  
  return { isRoot, accessibleCategories };
};

module.exports = {
  fetchPermissions,
  hasRootAccessSync,
  resolveUserPermissionContext,
  checkPermissions,
  resolveOrderAccessContext,
};
