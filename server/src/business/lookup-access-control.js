/**
 * @file lookup-access-control.js
 * @description Factory for creating permission-driven lookup access control
 * evaluators. Accepts a permission map and returns an async function that
 * resolves boolean access flags for a given user.
 */

'use strict';

const { resolveUserPermissionContext } = require('../services/permission-service');
const { logSystemException }           = require('../utils/logging/system-logger');
const AppError                         = require('../utils/AppError');

const CONTEXT = 'lookup-access-control';

/**
 * Creates an async access control evaluator for lookup endpoints.
 *
 * Each key in `permissionsMap` becomes a boolean flag on the returned access
 * object. A flag is `true` if the user is root or holds at least one of the
 * mapped permission strings.
 *
 * @param {object} options
 * @param {string} options.context - Caller context string for logging (e.g. `'sku-service'`).
 * @param {Record<string, string | string[]>} options.permissionsMap - Map of flag
 *   names to required permission string(s). A single string or array of strings
 *   is accepted per flag.
 * @returns {(user: AuthUser) => Promise<Record<string, boolean>>} Async evaluator
 *   that resolves an access flag object for the given user.
 */
const createLookupAccessControl = ({ context, permissionsMap }) => {
  return async (user) => {
    const logContext = `${CONTEXT}/${context}`;
    
    try {
      const { permissions, isRoot } = await resolveUserPermissionContext(user);
      
      const access = {};
      
      for (const [flag, requiredPermissions] of Object.entries(permissionsMap)) {
        const required = Array.isArray(requiredPermissions)
          ? requiredPermissions
          : [requiredPermissions];
        
        access[flag] = isRoot || required.some((perm) => permissions.includes(perm));
      }
      
      return access;
    } catch (err) {
      logSystemException(err, 'Failed to evaluate lookup access control', {
        context: logContext,
        userId: user?.id,
      });
      
      throw AppError.businessError('Unable to evaluate lookup access control.');
    }
  };
};

module.exports = {
  createLookupAccessControl,
};
