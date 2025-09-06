import { useCallback } from 'react';
import type { PermissionCheckOptions } from '@features/authorize/state/authorzeTypes';

const useHasPermission = (permissions: string[]) => {
  return useCallback(
    (
      required: string | string[],
      options: PermissionCheckOptions = {}
    ): boolean => {
      const { requireAll = false, bypassPermissions = ['root_access'] } = options;
      
      // Bypass check if user has any bypass-level permission
      if (permissions.some((p) => bypassPermissions.includes(p))) return true;
      
      const requiredPermissions = Array.isArray(required) ? required : [required];
      
      return requireAll
        ? requiredPermissions.every((p) => permissions.includes(p))
        : requiredPermissions.some((p) => permissions.includes(p));
    },
    [permissions]
  );
};

export default useHasPermission;
