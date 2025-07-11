const { checkPermissions } = require('../services/role-permission-service');

/**
 * Determines if the user has permission to access the internal `code` field for order types.
 * This includes permission to filter by, sort by, or display the `code` field.
 *
 * @param {Object} user - The authenticated user object.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the user has access, otherwise `false`.
 */
const canViewOrderTypeCode = async (user) => {
  return await checkPermissions(user, ['view_order_type_code']);
};

module.exports = {
  canViewOrderTypeCode,
};
