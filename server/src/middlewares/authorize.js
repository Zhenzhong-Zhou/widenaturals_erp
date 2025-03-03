const { logError } = require('../utils/logger-helper');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const AppError = require('../utils/AppError');
const redisClient = require('../utils/redis-client');

/**
 * Middleware to authorize users based on their role and required permissions.
 *
 * @param {string[]} requiredPermissions - Array of permissions required for the route.
 * @returns {function} - Middleware function for authorization.
 */
const authorize = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // Ensure the user is authenticated
      if (!req.user) {
        throw AppError.authenticationError(
          'Unauthorized: User not authenticated.'
        );
      }

      const { role } = req.user;

      // Try to fetch permissions from cache
      let rolePermissions;
      const cacheKey = `role_permissions:${role}`;
      const cachedPermissions = await redisClient.get(cacheKey);

      if (cachedPermissions) {
        rolePermissions = JSON.parse(cachedPermissions);
      } else {
        // Fetch permissions from the database if not in cache
        rolePermissions = await getRolePermissionsByRoleId(role);
        if (!rolePermissions) {
          throw AppError.authorizationError('Role permissions not found.', {
            details: { role },
          });
        }

        // Cache the permissions with a 1-hour expiration time
        await redisClient.set(
          cacheKey,
          JSON.stringify(rolePermissions),
          'EX',
          3600
        );
      }

      const userPermissions = rolePermissions.permissions.map((perm) => perm);

      // Allow if the user has `root_access`
      if (userPermissions.includes('root_access')) {
        return next();
      }

      // Check if the user has all required permissions
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        throw AppError.authorizationError(
          'Forbidden: Insufficient permissions.',
          {
            details: {
              missingPermissions: requiredPermissions.filter(
                (perm) => !userPermissions.includes(perm)
              ),
            },
          }
        );
      }

      // User is authorized, proceed to the next middleware or controller
      next();
    } catch (error) {
      if (!(error instanceof AppError)) {
        logError('Unexpected error in authorization middleware:', {
          message: error.message,
          stack: error.stack,
        });
        return next(
          AppError.authorizationError(
            'An unexpected error occurred during authorization.'
          )
        );
      }
      next(error); // Pass AppError to error handlers
    }
  };
};

module.exports = authorize;
