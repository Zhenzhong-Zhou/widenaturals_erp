/**
 * Checks if the user has permission to view the inventory overview.
 *
 * @param permissions - Array of permission strings assigned to the user.
 * @returns `true` if the user has any of the inventory overview access permissions, otherwise `false`.
 */
export const canViewInventoryOverview = (permissions: string[]): boolean => {
  const requiredPermissions = [
    'root_access',
    'view_inventory',
    'view_location_inventory',
    'view_inventory_summary',
  ];
  
  return requiredPermissions.some((perm) => permissions.includes(perm));
};

export const canAccessInventoryReports = (permissions: string[]) =>
  permissions.includes('view_inventory_reports');
