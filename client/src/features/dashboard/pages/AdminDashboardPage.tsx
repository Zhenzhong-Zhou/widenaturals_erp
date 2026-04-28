import { type FC } from 'react';
import Stack from '@mui/material/Stack';
import { useAppSelector } from '@store/storeHooks';
import { selectSelfUserFullName } from '@features/user';
import { DashboardLayout, MyWarehouses } from '@features/dashboard/components';
import { CustomTypography } from '@components/index';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardInventoryOverview from '../components/sections/DashboardInventoryOverview';

const AdminDashboardPage: FC<DashboardPageProps> = () => {
  const fullName = useAppSelector(selectSelfUserFullName);
  
  return (
    <DashboardLayout
      fullName={fullName ?? undefined}
      header={
        <CustomTypography variant="h6" fontWeight={600} gutterBottom>
          Administrative Overview
        </CustomTypography>
      }
    >
      <Stack spacing={3}>
        <DashboardInventoryOverview />
        <MyWarehouses />
      </Stack>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
