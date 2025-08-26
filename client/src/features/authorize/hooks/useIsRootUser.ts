import usePermissions from '@hooks/usePermissions';
import { isRootUser } from '@features/authorize/utils/permissionUtils';

const useIsRootUser = () => {
  const { roleName, permissions } = usePermissions();
  return isRootUser(roleName, permissions);
};

export default useIsRootUser;