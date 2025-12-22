const { logError } = require('../utils/logger-helper');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const AppError = require('../utils/AppError');
const redisClient = require('../utils/redis-client');

/**
 * Resolve and attach permissions for the authenticated user.
 *
 * Internal authorization helper.
 *
 * Responsibilities:
 * - Ensure the request is authenticated
 * - Resolve role-based permissions via cache or repository
 * - Attach resolved permissions to req.permissions for downstream checks
 *
 * Guarantees:
 * - Throws AppError if authentication or permission resolution fails
 * - On success, req.permissions is a normalized array of permission strings
 *
 * Intended usage:
 * - Used internally by authorize / authorizeAny middleware only
 * - Must NOT be invoked directly by controllers or services
 *
 * @param {Object} req - Express request object
 * @returns {Promise<string[]>} Array of permission identifiers
 */
const resolvePermissions = async (req) => {
  if (!req.user) {
    throw AppError.authenticationError('Unauthorized: User not authenticated.');
  }
  
  // Reuse permissions if already resolved earlier in the pipeline
  if (Array.isArray(req.permissions)) {
    return req.permissions;
  }
  
  const { role } = req.user;
  const cacheKey = `role_permissions:${role}`;
  
  let rolePermissions;
  const cached = await redisClient.get(cacheKey);
  
  if (cached) {
    rolePermissions = JSON.parse(cached);
  } else {
    rolePermissions = await getRolePermissionsByRoleId(role);
    
    if (!rolePermissions || !Array.isArray(rolePermissions.permissions)) {
      throw AppError.authorizationError('Role permissions not found.', {
        details: { role },
      });
    }
    
    await redisClient.set(
      cacheKey,
      JSON.stringify(rolePermissions),
      'EX',
      3600 // 1 hour
    );
  }
  
  req.permissions = rolePermissions.permissions;
  return req.permissions;
};

/**
 * AND-based authorization middleware.
 *
 * The request is allowed ONLY IF the user has ALL required permissions.
 *
 * Root override:
 * - Users with `root_access` automatically pass
 *
 * Typical usage:
 *   authorize(['USER_VIEW', 'USER_EDIT'])
 *
 * @param {string[]} requiredPermissions
 * @returns {Function} Express middleware
 */
const authorize = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const permissions = await resolvePermissions(req);
      
      if (permissions.includes('root_access')) {
        return next();
      }
      
      const hasAll = requiredPermissions.every((perm) =>
        permissions.includes(perm)
      );
      
      if (!hasAll) {
        throw AppError.authorizationError(
          'Forbidden: Insufficient permissions.',
          {
            missingPermissions: requiredPermissions.filter(
              (p) => !permissions.includes(p)
            ),
          }
        );
      }
      
      next();
    } catch (err) {
      logError(err, req, { middleware: 'authorize' });
      next(err);
    }
  };
};

/**
 * OR-based authorization middleware.
 *
 * The request is allowed IF the user has AT LEAST ONE required permission.
 *
 * Root override:
 * - Users with `root_access` automatically pass
 *
 * Typical usage:
 *   authorizeAny(['USER_VIEW_CARD', 'USER_VIEW_LIST'])
 *
 * @param {string[]} requiredPermissions
 * @returns {Function} Express middleware
 */
const authorizeAny = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const permissions = await resolvePermissions(req);
      
      if (permissions.includes('root_access')) {
        return next();
      }
      
      const hasAny = requiredPermissions.some((perm) =>
        permissions.includes(perm)
      );
      
      if (!hasAny) {
        throw AppError.authorizationError(
          'Forbidden: Insufficient permissions.',
          {
            requiredAnyOf: requiredPermissions,
          }
        );
      }
      
      next();
    } catch (err) {
      logError(err, req, { middleware: 'authorizeAny' });
      next(err);
    }
  };
};

module.exports = {
  authorize,
  authorizeAny,
};
