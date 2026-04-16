/**
 * @file authorize.js
 * @description Authorization middleware factory functions for protecting routes
 * based on role-derived permissions.
 *
 * Exports:
 *   - `authorize`    — AND logic, requires ALL listed permissions
 *   - `authorizeAny` — OR logic, requires AT LEAST ONE listed permission
 *
 * Both middlewares delegate to `resolvePermissions`, which is cache-first
 * and falls back to the database. Permissions are attached to `req.permissions`
 * so subsequent middleware in the same request can reuse them without
 * re-fetching.
 */

'use strict';

const AppError = require('../utils/AppError');
const { tryCacheRead, tryCacheWrite } = require('../utils/cache-utils');
const { getStatusId } = require('../config/status-cache');
const {
  getRolePermissionsByRoleId,
} = require('../repositories/role-permission-repository');

// -----------------------------------------------------------------------------
// Permission resolver (shared by all authorization middleware)
// -----------------------------------------------------------------------------

/**
 * Resolves and attaches role-based permissions for the authenticated user.
 *
 * Resolution order:
 *   1. Returns `req.permissions` immediately if already resolved this request.
 *   2. Attempts a cache read (best-effort — failure falls through to DB).
 *   3. Falls back to a DB query and writes the result back to cache.
 *
 * Side effect:
 *   Sets `req.permissions` to the resolved string array so subsequent
 *   middleware in the same request can read it without re-fetching.
 *
 * @param {import('express').Request & {
 *   auth?: import('./authenticate').AuthContext,
 *   permissions?: string[]
 * }} req - Express request object, must have `req.auth` set by authenticate middleware.
 * @returns {Promise<string[]>} Resolved permission strings for the user's role.
 * @throws {AppError} If the request is unauthenticated or role permissions are
 *   not found in the database.
 */
const resolvePermissions = async (req) => {
  // Guard both req.auth and req.auth.user — if authenticate middleware was
  // skipped or failed silently, req.auth may be undefined entirely.
  if (!req.auth?.user) {
    throw AppError.authenticationError('Unauthorized: User not authenticated.');
  }

  // Permissions already resolved earlier in this request — reuse them.
  if (Array.isArray(req.permissions)) {
    return req.permissions;
  }

  const { role } = req.auth.user;
  const cacheKey = `role_permissions:${role}`;

  // ---------------------------------------------------------------------------
  // Cache-first lookup (best-effort)
  // tryCacheRead swallows cache errors internally — a miss or failure here
  // is expected and falls through to the DB.
  // ---------------------------------------------------------------------------
  let rolePermissions = await tryCacheRead(cacheKey);

  // ---------------------------------------------------------------------------
  // DB fallback (source of truth)
  // Only reached on a cache miss or cache unavailability.
  // ---------------------------------------------------------------------------
  if (!rolePermissions) {
    const activeStatusId = getStatusId('general_active');
    rolePermissions = await getRolePermissionsByRoleId(role, activeStatusId);

    if (!rolePermissions || !Array.isArray(rolePermissions.permissions)) {
      throw AppError.authorizationError('Role permissions not found.', {
        details: { role },
      });
    }

    // Write back to cache best-effort (non-blocking). A failure here is
    // acceptable — the next request will fall through to DB again.
    await tryCacheWrite(cacheKey, rolePermissions, 3600);
  }

  req.permissions = rolePermissions.permissions;
  return req.permissions;
};

// -----------------------------------------------------------------------------
// AND-based authorization — requires ALL listed permissions
// -----------------------------------------------------------------------------

/**
 * Express middleware factory that requires the authenticated user to hold
 * ALL the specified permissions (AND logic).
 *
 * Users with `root_access` bypass the permission check entirely.
 *
 * @param {string[]} [requiredPermissions=[]] - Permission strings that must
 *   ALL be present on the user's role.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.delete('/users/:id', authenticate(), authorize(['users:delete']), handler);
 */
const authorize = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const permissions = await resolvePermissions(req);

      // root_access is a superuser bypass — skip all permission checks.
      if (permissions.includes('root_access')) {
        next();
        return;
      }

      const missingPermissions = requiredPermissions.filter(
        (p) => !permissions.includes(p)
      );

      if (missingPermissions.length > 0) {
        throw AppError.authorizationError(
          'Forbidden: Insufficient permissions.',
          {
            details: { missingPermissions },
          }
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

// -----------------------------------------------------------------------------
// OR-based authorization — requires AT LEAST ONE listed permission
// -----------------------------------------------------------------------------

/**
 * Express middleware factory that requires the authenticated user to hold
 * AT LEAST ONE of the specified permissions (OR logic).
 *
 * Users with `root_access` bypass the permission check entirely.
 *
 * @param {string[]} [requiredPermissions=[]] - Permission strings of which
 *   at least one must be present on the user's role.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/reports', authenticate(), authorizeAny(['reports:read', 'admin:access']), handler);
 */
const authorizeAny = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const permissions = await resolvePermissions(req);

      // root_access is a superuser bypass — skip all permission checks.
      if (permissions.includes('root_access')) {
        next();
        return;
      }

      const hasAny = requiredPermissions.some((p) => permissions.includes(p));

      if (!hasAny) {
        throw AppError.authorizationError(
          'Forbidden: Insufficient permissions.',
          {
            details: { requiredAnyOf: requiredPermissions },
          }
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  authorize,
  authorizeAny,
};
