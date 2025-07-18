const { checkPermissions } = require('../services/role-permission-service');
const AppError = require('../utils/AppError');

/**
 * Validates whether the user has permission to view external data.
 * If not, and `includeExternal` is requested, throws a business-level error.
 *
 * @param user - The authenticated user object
 * @param includeExternal - Flag indicating whether external data access is requested
 *
 * @throws {AppError} If permission is missing and external data is requested
 * @returns {Promise<boolean>} - Resolves to true if access is permitted, false otherwise
 */
const enforceExternalAccessPermission = async (user, includeExternal) => {
  if (!includeExternal) return false;
  
  const hasPermission = await checkPermissions(user, ['view_external_data']);
  
  if (!hasPermission) {
    throw AppError.businessError('Access to external data is not permitted for this user.');
  }
  
  return true;
};

module.exports = {
  enforceExternalAccessPermission,
};
