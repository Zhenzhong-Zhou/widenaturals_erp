export const getEffectivePermissions = (
  roleName: string,
  permissions: string[]
): string[] => {
  if (roleName === 'root_admin') {
    return ['root_access']; // Root admin only has root access
  }
  return permissions;
};

export const hasPermission = (
  requiredPermission: string | undefined,
  permissions: string[],
  roleName: string
): boolean => {
  return (
    roleName === 'root_admin' ||
    (requiredPermission ? permissions.includes(requiredPermission) : true)
  );
};
