import { type FC } from 'react';
import Stack from '@mui/material/Stack';
import { useAppSelector } from '@store/storeHooks';
import { selectSelfUserFullName } from '@features/user';
import {
  DashboardInventoryOverview,
  DashboardLayout,
  DashboardSectionGate,
  DashboardWarehouseAlerts,
  MyWarehouses,
} from '@features/dashboard/components';
import { CustomTypography } from '@components/index';
import type { DashboardPageProps } from '@features/dashboard';
import { useDashboardWarehouses } from '@features/dashboard/hooks';

const AdminDashboardPage: FC<DashboardPageProps> = () => {
  const fullName = useAppSelector(selectSelfUserFullName);
  const { warehouses, loading, error, canView } = useDashboardWarehouses();

  return (
    <DashboardLayout
      fullName={fullName ?? undefined}
      header={
        <CustomTypography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
          Administrative Overview
        </CustomTypography>
      }
    >
      <Stack spacing={3}>
        <DashboardSectionGate canView={canView} loading={loading} error={error}>
          <DashboardInventoryOverview warehouses={warehouses} />
          <DashboardWarehouseAlerts warehouses={warehouses} />
        </DashboardSectionGate>
        <MyWarehouses />
      </Stack>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
