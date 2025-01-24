const redisClient = require('../utils/redis-client');
const { getRolePermissionsByRoleId } = require('../repositories/role-permission-repository');

/**
 * Fetch permissions for a given role ID, with caching
 * @param {string} roleId - The role ID
 * @returns {Promise<string[]>} - Array of permission keys
 */
const fetchPermissions = async (roleId) => {
  const cacheKey = `role_permissions:${roleId}`;
  
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
};

module.exports = {
  fetchPermissions,
};
