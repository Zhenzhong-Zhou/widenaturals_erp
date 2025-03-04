import { FC } from 'react';
import { AdminDashboardPage, ManagerDashboardPage, UserDashboardPage } from '../index.ts';
import { DashboardPageProps } from '../state/dashboardTypes.ts';

const roleComponentMap: Record<string, FC<DashboardPageProps>> = {
  root_admin: AdminDashboardPage,
  admin: AdminDashboardPage,
  manager: ManagerDashboardPage,
};

const DashboardPage: FC<DashboardPageProps> = (props) => {
  const DashboardComponent = roleComponentMap[props.roleName] || UserDashboardPage;
  return <DashboardComponent {...props} />;
};

export default DashboardPage;
