import type { FC } from 'react';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import CustomTypography from '@components/common/CustomTypography';

const ManagerDashboardPage: FC<DashboardPageProps> = ({
  fullName = 'Unknown User',
}) => {
  
  return (
    <DashboardLayout fullName={fullName}>
      <CustomTypography variant="body1" sx={{ mb: 2 }}>
        Manager Dashboard Page
      </CustomTypography>
    </DashboardLayout>
  );
};

export default ManagerDashboardPage;
