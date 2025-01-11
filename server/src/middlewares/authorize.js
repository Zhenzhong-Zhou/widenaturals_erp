const { logError } = require('../utils/logger-helper');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
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
        throw AppError.authenticationError(
          'Unauthorized: User not authenticated.'
        );
      }

      const { role_id } = req.user;

      // Fetch role permissions
      const rolePermissions = await getRolePermissionsByRoleId(role_id);

      if (!rolePermissions) {
        throw AppError.authorizationError('Role permissions not found.', {
          details: { role_id },
        });
      }

      const userPermissions = rolePermissions.map((perm) => perm); // Use the permissions field

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
