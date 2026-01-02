import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePermissions from '@hooks/usePermissions';
import useHasPermission from '@features/authorize/hooks/useHasPermission';

const usePagePermissionGuard = (requiredPermissions: string[]) => {
  const navigate = useNavigate();

  const { loading: permLoading, permissions } = usePermissions();
  const hasPermission = useHasPermission(permissions);

  const isAllowed = hasPermission(requiredPermissions);

  useEffect(() => {
    if (!permLoading && !isAllowed) {
      navigate('/access-denied', { replace: true });
    }
  }, [permLoading, isAllowed, navigate]);

  return {
    permLoading,
    isAllowed,
  };
};

export default usePagePermissionGuard;
