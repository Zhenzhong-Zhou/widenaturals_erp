const { checkPermissions } = require('../services/role-permission-service');

/**
 * Checks if the user has permission to view the warehouse inventory summary.
 * Accepts users with any of the listed permissions.
 *
 * @param {object} user - The authenticated user object.
 * @returns {Promise<boolean>} - True if the user has access, otherwise false.
 */
const canViewWarehouseInventorySummary = async (user) => {
  return await checkPermissions(user, [
    'root_access',
    'view_inventory_summary',
    'view_warehouse_inventory_summary',
    'view_warehouse_inventory',
    'view_inventory_report',
  ]);
};

module.exports = {
  canViewWarehouseInventorySummary,
};
