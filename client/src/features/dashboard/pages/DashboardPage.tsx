import type { FC } from 'react';
import AdminDashboardPage from '@features/dashboard/pages/AdminDashboardPage';
import ManagerDashboardPage from '@features/dashboard/pages/ManagerDashboardPage';
import UserDashboardPage from '@features/dashboard/pages/UserDashboardPage';
import type { DashboardPageProps } from '@features/dashboard';
import { usePermissionsContext } from '@context/PermissionsContext';

type RoleName = 'root_admin' | 'admin' | 'manager';

const roleComponentMap: Partial<Record<RoleName, FC<DashboardPageProps>>> = {
  root_admin: AdminDashboardPage,
  admin: AdminDashboardPage,
  manager: ManagerDashboardPage,
};

const resolveDashboardComponent = (
  roleName: string | null
): FC<DashboardPageProps> => {
  if (!roleName) {
    return UserDashboardPage;
  }
  
  return roleComponentMap[roleName as RoleName] ?? UserDashboardPage;
};

/**
 * DashboardPage
 *
 * Role-aware dashboard entry point.
 *
 * Responsibilities:
 * - Select the appropriate dashboard implementation based on role
 * - Provide a safe default dashboard for unresolved or unsupported roles
 *
 * Behavior:
 * - `root_admin` and `admin` share the same dashboard implementation
 * - `manager` receives a manager-specific dashboard
 * - Unresolved or unknown roles fall back to the user dashboard
 *
 * Design principles:
 * - Non-blocking: renders immediately even if role is not yet resolved
 * - Declarative: role-to-dashboard mapping is centralized and explicit
 * - Safe defaults: never crashes due to unknown roles
 *
 * MUST NOT:
 * - Perform permission checks
 * - Fetch user or session data
 * - Block rendering based on auth or permission readiness
 *
 * Notes:
 * - Fine-grained access control is handled inside dashboard pages
 * - This component only resolves which dashboard variant to render
 */
const DashboardPage: FC<DashboardPageProps> = (props) => {
  const { roleName } = usePermissionsContext();
  const DashboardComponent = resolveDashboardComponent(roleName);
  
  return <DashboardComponent {...props} />;
};

export default DashboardPage;
