import type { FC } from 'react';
import AdminDashboardPage from '@features/dashboard/pages/AdminDashboardPage';
import ManagerDashboardPage from '@features/dashboard/pages/ManagerDashboardPage';
import UserDashboardPage from '@features/dashboard/pages/UserDashboardPage';
import type { DashboardPageProps } from '@features/dashboard';

const roleComponentMap: Record<string, FC<DashboardPageProps>> = {
  root_admin: AdminDashboardPage,
  admin: AdminDashboardPage,
  manager: ManagerDashboardPage,
};

const DashboardPage: FC<DashboardPageProps> = ({
  roleName = 'user', // Provide default role
  ...props
}) => {
  const DashboardComponent = roleComponentMap[roleName] || UserDashboardPage;
  return <DashboardComponent {...props} />;
};

export default DashboardPage;
