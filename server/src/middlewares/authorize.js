const AppError = require('../utils/AppError');
const { tryCacheRead, tryCacheWrite } = require('../utils/cache-utils');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');
const { logError } = require('../utils/logger-helper');

/**
 * Resolve and attach permissions for the authenticated user.
 *
 * Internal authorization helper.
 *
 * Responsibilities:
 * - Ensure the request is authenticated
 * - Resolve role-based permissions (cache-first, DB fallback)
 * - Attach resolved permissions to req.permissions
 *
 * Guarantees:
 * - MUST NOT fail due to cache unavailability
 * - Throws AppError only for auth / authorization violations
 *
 * @param {Object} req - Express request object
 * @returns {Promise<string[]>}
 */
const resolvePermissions = async (req) => {
  if (!req.user) {
    throw AppError.authenticationError(
      'Unauthorized: User not authenticated.'
    );
  }
  
  // Reuse permissions if already resolved earlier
  if (Array.isArray(req.permissions)) {
    return req.permissions;
  }
  
  const { role } = req.user;
  const cacheKey = `role_permissions:${role}`;
  
  /* ----------------------------------------
   * Cache-first lookup (BEST-EFFORT)
   * -------------------------------------- */
  let rolePermissions = await tryCacheRead(cacheKey);
  
  /* ----------------------------------------
   * DB fallback (SOURCE OF TRUTH)
   * -------------------------------------- */
  if (!rolePermissions) {
    rolePermissions = await getRolePermissionsByRoleId(role);
    
    if (
      !rolePermissions ||
      !Array.isArray(rolePermissions.permissions)
    ) {
      throw AppError.authorizationError(
        'Role permissions not found.',
        { details: { role } }
      );
    }
    
    // Best-effort cache write (non-blocking)
    await tryCacheWrite(cacheKey, rolePermissions, 3600);
  }
  
  req.permissions = rolePermissions.permissions;
  return req.permissions;
};

/**
 * AND-based authorization middleware.
 *
 * Requires ALL permissions.
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
 * Requires AT LEAST ONE permission.
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
          { requiredAnyOf: requiredPermissions }
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
