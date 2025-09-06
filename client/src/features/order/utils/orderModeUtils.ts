import { ORDER_VIEW_MODES } from '@features/order/constants/orderViewModes';
import usePermissions from '@hooks/usePermissions';
import { hasPermission } from '@utils/permissionUtils';

export const getVisibleOrderModes = (): typeof ORDER_VIEW_MODES[keyof typeof ORDER_VIEW_MODES][] => {
  const { roleName, permissions } = usePermissions();
  
  const ctx = {
    isRoot: roleName === 'root_admin',
    has: (perm: string) => hasPermission(perm, permissions, roleName),
    hasAny: (perms: string[]) => perms.some((p) => hasPermission(p, permissions, roleName)),
  };
  
  return Object.values(ORDER_VIEW_MODES).filter((mode) => mode.canSee(ctx));
};