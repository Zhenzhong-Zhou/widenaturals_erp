/**
 * @file lot-adjustment-type-business.js
 * @description Domain business logic for lot adjustment type access control.
 */

'use strict';

const { checkPermissions } = require('../services/permission-service');
const AppError = require('../utils/AppError');

/**
 * Enforces that the requesting user has permission to access external data
 * when `includeExternal` is requested.
 *
 * No-ops and returns `false` if `includeExternal` is falsy — no permission
 * check needed when external data is not requested.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {boolean} includeExternal - Whether external data was requested.
 * @returns {Promise<boolean>} `true` if external access is granted, `false` if not requested.
 * @throws {AppError} businessError if the user lacks `view_external_data` permission.
 */
const enforceExternalAccessPermission = async (user, includeExternal) => {
  if (!includeExternal) return false;
  
  const hasPermission = await checkPermissions(user, ['view_external_data']);
  
  if (!hasPermission) {
    throw AppError.businessError(
      'Access to external data is not permitted for this user.'
    );
  }
  
  return true;
};

module.exports = {
  enforceExternalAccessPermission,
};
