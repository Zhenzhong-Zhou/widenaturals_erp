const { checkPermissions } = require('../services/role-permission-service');

/**
 * Checks if the user has permission to view the inventory summary.
 * Accepts users with any of the listed permissions.
 *
 * @param {object} user - The user object containing role info.
 * @returns {Promise<boolean>} - True if user has access, else false.
 */
const canViewInventorySummary = async (user) => {
  return await checkPermissions(user, [
    'root_access',
    'view_inventory_summary',
    'view_inventory',
    'view_inventory_report',
  ]);
};

module.exports = {
  canViewInventorySummary,
};
