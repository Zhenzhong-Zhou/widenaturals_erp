import { FC } from 'react';
import {
  AdminDashboardPage,
  ManagerDashboardPage,
  UserDashboardPage,
} from '../index.ts';

const DashboardPage: FC<{ roleName: string; permissions: string[] }> = ({
  roleName,
  permissions,
}) => {
  switch (roleName) {
    case 'root_admin':
      return (
        <AdminDashboardPage roleName={roleName} permissions={permissions} />
      );
    case 'admin':
      return (
        <AdminDashboardPage roleName={roleName} permissions={permissions} />
      );
    case 'manager':
      return (
        <ManagerDashboardPage roleName={roleName} permissions={permissions} />
      );
    default:
      return (
        <UserDashboardPage roleName={roleName} permissions={permissions} />
      );
  }
};

export default DashboardPage;
