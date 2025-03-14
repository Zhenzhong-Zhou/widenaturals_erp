import { FC } from 'react';
import {
  AdminDashboardPage,
  ManagerDashboardPage,
  UserDashboardPage,
} from '../index.ts';
import { DashboardPageProps } from '../state/dashboardTypes.ts';

const roleComponentMap: Record<string, FC<DashboardPageProps>> = {
  root_admin: AdminDashboardPage,
  admin: AdminDashboardPage,
  manager: ManagerDashboardPage,
};

const DashboardPage: FC<DashboardPageProps> = ({
                                                 roleName = 'user', // Provide default role
                                                 ...props
                                               }) => {
  const DashboardComponent =
    roleComponentMap[roleName] || UserDashboardPage;
  return <DashboardComponent {...props} />;
};

export default DashboardPage;
