import { useEffect } from 'react';
import type { PermissionCheckOptions } from '@features/authorize';
import { useHasPermission } from '@features/authorize/hooks';
import ROUTE_PERMISSIONS from '@utils/constants/routePermissionConstants';
import { usePaginatedWarehouses } from '@hooks/index';

const useDashboardWarehouses = () => {
  let hasPermission: (
    required: string | readonly string[],
    options?: PermissionCheckOptions
  ) => boolean | 'pending';
  hasPermission = useHasPermission();
  const canView =
    hasPermission(ROUTE_PERMISSIONS.WAREHOUSE_INVENTORY.VIEW) === true;

  const {
    data: warehouses,
    loading,
    error,
    fetchWarehouses,
    resetWarehouses,
  } = usePaginatedWarehouses();

  useEffect(() => {
    if (canView) fetchWarehouses({ page: 1, limit: 100 });
  }, [canView, fetchWarehouses]);

  useEffect(
    () => () => {
      resetWarehouses();
    },
    [resetWarehouses]
  );

  return { warehouses, loading, error, canView };
};

export default useDashboardWarehouses;
