const { checkPermissions } = require('../services/role-permission-service');

/**
 * Checks whether a user is authorized to view pricing types.
 *
 * @param {object} user - The authenticated user object.
 * @returns {Promise<boolean>} - True if the user has any of the required permissions.
 */
const canViewPricingTypes = async (user) => {
  return await checkPermissions(user, [
    'view_pricing_types',
    'view_pricing_config',
    'manage_pricing',
    'manage_catalog',
  ]);
};

module.exports = {
  canViewPricingTypes,
};
