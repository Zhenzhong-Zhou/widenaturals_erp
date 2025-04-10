import { FC } from 'react';
import { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import Typography from '@components/common/Typography';
import PermissionList from '@features/dashboard/components/PermissionList';

const UserDashboardPage: FC<DashboardPageProps> = ({
  fullName,
  permissions = [],
}) => {
  return (
    <DashboardLayout fullName={fullName}>
      <Typography variant="body1" gutterBottom>
        Your Permissions:
      </Typography>
      <PermissionList permissions={permissions} />
      <Typography variant="body1">
        This is the user dashboard, where you can access reports, manage your
        profile, and view notifications.
      </Typography>
    </DashboardLayout>
  );
};

export default UserDashboardPage;
