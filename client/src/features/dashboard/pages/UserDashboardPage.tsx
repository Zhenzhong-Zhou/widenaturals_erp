import type { FC } from 'react';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import CustomTypography from '@components/common/CustomTypography';
import PermissionList from '@features/dashboard/components/PermissionList';

const UserDashboardPage: FC<DashboardPageProps> = ({
  fullName,
  permissions = [],
}) => {
  return (
    <DashboardLayout fullName={fullName}>
      <CustomTypography variant="body1" gutterBottom>
        Your Permissions:
      </CustomTypography>
      <PermissionList permissions={permissions} />
      <CustomTypography variant="body1">
        This is the user dashboard, where you can access reports, manage your
        profile, and view notifications.
      </CustomTypography>
    </DashboardLayout>
  );
};

export default UserDashboardPage;
