import {
  ROOT_PERMISSION,
  ROOT_ROLE,
} from '@features/authorize/constants/permission';

export const isRootUser = (
  roleName?: string | null,
  permissions: string[] = []
): boolean => {
  return roleName === ROOT_ROLE || permissions.includes(ROOT_PERMISSION);
};
