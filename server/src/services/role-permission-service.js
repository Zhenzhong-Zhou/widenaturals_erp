const redisClient = require('../utils/redis-client');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Fetch permissions and role name for a given role ID, with caching.
 *
 * @param {string} roleId - The role ID.
 * @returns {Promise<{ roleName: string, permissions: string[] }>} - Object containing role name and permissions.
 * @throws {AppError} - Throws if fetching data from the database fails.
 */
const fetchPermissions = async (roleId) => {
  const cacheKey = `role_permissions:${roleId}`;

  try {
    // Try fetching data from Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch role name and permissions from the database
    const { role_name, permissions } = await getRolePermissionsByRoleId(roleId);

    // Cache the data for 1 hour
    const dataToCache = { role_name, permissions };
    await redisClient.set(cacheKey, JSON.stringify(dataToCache), 'EX', 3600);

    return dataToCache;
  } catch (error) {
    // Log and throw the error for upstream handling
    logError('Error fetching permissions and role name:', {
      roleId,
      error: error.message,
    });
    throw AppError.serviceError('Failed to fetch permissions and role name.', {
      roleId,
      details: error.message,
    });
  }
};

/**
 * Checks whether the user has the required permissions.
 *
 * @param {object} user - The user object, must include `id` and `role`.
 * @param {string[]} requiredPermissions - Array of permissions to check.
 * @param {object} [options] - Optional flags.
 * @param {boolean} [options.requireAll=false] - If true, requires all permissions.
 * @param {boolean} [options.allowRootAccess=true] - If true, root_access bypasses check.
 * @returns {Promise<boolean>} - True if user has permission.
 */
const checkPermissions = async (
  user,
  requiredPermissions = [],
  { requireAll = false, allowRootAccess = true } = {}
) => {
  if (!user || !user.id || !user.role) return false;

  const { permissions } = await fetchPermissions(user.role); // cached or DB

  if (!permissions || permissions.length === 0) return false;

  // Root override
  if (allowRootAccess && permissions.includes('root_access')) {
    return true;
  }

  return requireAll
    ? requiredPermissions.every((perm) => permissions.includes(perm))
    : requiredPermissions.some((perm) => permissions.includes(perm));
};

module.exports = {
  fetchPermissions,
  checkPermissions,
};
