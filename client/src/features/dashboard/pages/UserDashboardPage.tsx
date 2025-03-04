import { FC } from 'react';
import { Typography } from '@components/index.ts';
import { DashboardLayout, DashboardPageProps, PermissionList } from '../index.ts';

const UserDashboardPage: FC<DashboardPageProps> = ({ fullName, permissions }) => {
  return (
    <DashboardLayout fullName={fullName}>
      <Typography variant="body1" gutterBottom>
        Your Permissions:
      </Typography>
      <PermissionList permissions={permissions} />
      <Typography variant="body1">
        This is the user dashboard, where you can access reports, manage your profile, and view notifications.
      </Typography>
    </DashboardLayout>
  );
};

export default UserDashboardPage;
