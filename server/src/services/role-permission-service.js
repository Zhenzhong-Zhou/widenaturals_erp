const redisClient = require('../utils/redis-client');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const AppError = require('../utils/AppError');

/**
 * Fetch permissions for a given role ID, with caching.
 *
 * @param {string} roleId - The role ID.
 * @returns {Promise<string[]>} - Array of permission keys.
 * @throws {AppError} - Throws if fetching permissions from the database fails.
 */
const fetchPermissions = async (roleId) => {
  const cacheKey = `role_permissions:${roleId}`;
  
  try {
    // Try fetching permissions from Redis cache
    const cachedPermissions = await redisClient.get(cacheKey);
    if (cachedPermissions) {
      return JSON.parse(cachedPermissions);
    }
    
    // Fetch permissions from the database
    const permissions = await getRolePermissionsByRoleId(roleId);
    
    // Cache the permissions for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(permissions), 'EX', 3600);
    
    return permissions;
  } catch (error) {
    // Log and throw the error for upstream handling
    console.error('Error fetching permissions:', { roleId, error: error.message });
    throw AppError.serviceError('Failed to fetch permissions.', {
      roleId,
      details: error.message,
    });
  }
};

module.exports = {
  fetchPermissions,
};
