import { type FC } from 'react';
import Stack from '@mui/material/Stack';
import { useAppSelector } from '@store/storeHooks';
import { selectSelfUserFullName } from '@features/user';
import CustomTypography from '@components/common/CustomTypography';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import type { DashboardPageProps } from '@features/dashboard';
import { DashboardInventoryOverview, MyWarehouses } from '@features/dashboard/components';

const UserDashboardPage: FC<DashboardPageProps> = () => {
  const fullName = useAppSelector(selectSelfUserFullName);
  
  return (
    <DashboardLayout
      fullName={fullName ?? undefined}
      header={
        <CustomTypography variant="h6" fontWeight={600} gutterBottom>
          Welcome
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

export default UserDashboardPage;
