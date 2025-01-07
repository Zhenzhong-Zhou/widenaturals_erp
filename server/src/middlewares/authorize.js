const { logError } = require('../utils/logger-helper');
const { getRolePermissionsByRoleId } = require('../repositories/role-permission-repository');
const AppError = require('../utils/app-error');

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
        throw new AppError('Unauthorized: User not authenticated.', 401, {
          type: 'AuthenticationError',
          isExpected: true,
        });
      }
      
      const { role_id } = req.user;
      
      // Fetch role permissions
      const rolePermissions = await getRolePermissionsByRoleId(role_id);
      
      if (!rolePermissions) {
        throw new AppError('Role permissions not found.', 403, {
          type: 'AuthorizationError',
          isExpected: true,
        });
      }
      
      const userPermissions = rolePermissions.permissions.map((perm) => perm); // Use the `key` field
      
      // Check if the user has all required permissions
      const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
      
      if (!hasPermission) {
        throw new AppError('Forbidden: Insufficient permissions.', 403, {
          type: 'AuthorizationError',
          isExpected: true,
          details: {
            missingPermissions: requiredPermissions.filter((perm) => !userPermissions.includes(perm)),
          },
        });
      }
      
      // User is authorized, proceed to the next middleware or controller
      next();
    } catch (error) {
      if (!(error instanceof AppError)) {
        logError('Unexpected error in authorization middleware:', error);
        return next(
          new AppError('An unexpected error occurred during authorization.', 500, {
            type: 'AuthorizationError',
          })
        );
      }
      next(error); // Pass AppError to error handlers
    }
  };
};

module.exports = authorize;
