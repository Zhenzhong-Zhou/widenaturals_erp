import { type FC, useEffect, useMemo } from 'react';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import SummaryStat from '@components/common/SummaryStat';
import { useHasPermission } from '@features/authorize/hooks';
import ROUTE_PERMISSIONS from '@utils/constants/routePermissionConstants';
import { usePaginatedWarehouses } from '@hooks/index';

/**
 * Cross-warehouse inventory KPI strip aggregated client-side from the
 * warehouse list payload. Provides at-a-glance totals across every
 * warehouse the current user has access to.
 *
 * Reuses the paginated warehouse list endpoint as the data source — the
 * list already returns a per-warehouse summary block, so the dashboard
 * can sum across rows without a dedicated endpoint. This works well at
 * small to moderate warehouse counts. If warehouse count grows past a
 * few dozen, migrate to a dedicated dashboard endpoint that aggregates
 * server-side.
 *
 * Does not include alert counts — those require the warehouse list
 * payload to expose per-warehouse alert counts or a separate endpoint.
 */
const DashboardInventoryOverview: FC = () => {
  const hasPermission = useHasPermission();
  const canView = hasPermission(ROUTE_PERMISSIONS.WAREHOUSE_INVENTORY.VIEW) === true;
  
  const {
    data: warehouses,
    loading,
    error,
    fetchWarehouses,
    resetWarehouses,
  } = usePaginatedWarehouses();
  
  useEffect(() => {
    if (canView) {
      fetchWarehouses({ page: 1, limit: 100 });
    }
  }, [canView, fetchWarehouses]);
  
  useEffect(() => () => {
    resetWarehouses();
  }, [resetWarehouses]);
  
  const totals = useMemo(() => {
    if (!warehouses) return null;
    return warehouses.reduce(
      (acc, w) => ({
        warehouseCount: acc.warehouseCount + 1,
        batches: acc.batches + (w.summary?.totalBatches ?? 0),
        quantity: acc.quantity + (w.summary?.totalQuantity ?? 0),
        reserved: acc.reserved + (w.summary?.totalReserved ?? 0),
        available: acc.available + (w.summary?.availableQuantity ?? 0),
      }),
      { warehouseCount: 0, batches: 0, quantity: 0, reserved: 0, available: 0 }
    );
  }, [warehouses]);
  
  if (!canView) return null;
  if (error) return null;
  if (loading) return <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />;
  if (!totals || totals.warehouseCount === 0) return null;
  
  return (
    <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={700} mb={2}>
        Inventory Overview
      </CustomTypography>
      <Stack direction="row" spacing={4} flexWrap="wrap">
        <SummaryStat label="Warehouses" value={totals.warehouseCount} minWidth={90} />
        <SummaryStat label="Batches" value={totals.batches} minWidth={90} />
        <SummaryStat label="Total" value={totals.quantity} minWidth={100} />
        <SummaryStat label="Reserved" value={totals.reserved} minWidth={100} />
        <SummaryStat label="Available" value={totals.available} minWidth={100} />
      </Stack>
    </Card>
  );
};

export default DashboardInventoryOverview;
