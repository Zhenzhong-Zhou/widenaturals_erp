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
 * Checks if a user has at least one of the required permissions.
 *
 * @param {object} user - The user object containing the role ID.
 * @param {string[]} requiredPermissions - Array of permissions to check.
 * @returns {Promise<boolean>} - True if the user has permission, otherwise false.
 */
const checkPermissions = async (user, requiredPermissions) => {
  if (!user || !user.role) return false;

  // Fetch permissions for the role from cache or database
  const { permissions } = await fetchPermissions(user.role);

  if (!permissions || permissions.length === 0) return false;

  // Allow if the user has `root_access`
  if (permissions.includes('root_access')) return true;

  // Check if user has at least one required permission
  return requiredPermissions.some((permission) =>
    permissions.includes(permission)
  );
};

module.exports = {
  fetchPermissions,
  checkPermissions,
};
