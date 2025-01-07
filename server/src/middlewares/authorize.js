const { logError } = require('../utils/logger-helper');
const { getRolePermissionsByRoleId } = require('../repositories/role-permission-repository');

/**
 * Middleware to authorize users based on their role.
 *
 * @returns {function} - Middleware function for authorization.
 * @param requiredPermissions
 */
const authorize = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // Ensure the user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      }
      
      const { role_id } = req.user;
      
      const { permissions } = await getRolePermissionsByRoleId(role_id);
      const userPermissions = permissions.map((perm) => perm); // Use the `key` field
      
      // Check if the user has all required permissions
      const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden: Insufficient permissions',
        });
      }

      // User is authorized, proceed to the next middleware or controller
      next();
    } catch (error) {
      logError('Authorization middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = authorize;
