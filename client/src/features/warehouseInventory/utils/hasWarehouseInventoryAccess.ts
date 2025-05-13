/**
 * Determines whether the user has access to view the warehouse inventory summary.
 *
 * This function checks if the user has at least one of the allowed permissions
 * related to inventory viewing at the warehouse level.
 *
 * @param {string[]} permissions - Array of permission strings assigned to the user.
 * @returns {boolean} True if the user has any matching permission; otherwise false.
 */
export const hasWarehouseInventoryAccess = (permissions: string[] = []): boolean => {
  const allowed = [
    'root_access',
    'view_inventory_summary',
    'view_warehouse_inventory_summary',
    'view_warehouse_inventory',
    'view_inventory_report',
  ];
  
  return permissions.some((perm) => allowed.includes(perm));
};
