import type { FC, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useSession from '@hooks/useSession';

interface GuestRouteProps {
  /** Optional children; defaults to <Outlet /> for nested routes */
  children?: ReactNode;
}

/**
 * GuestRoute
 *
 * Route guard for unauthenticated users only.
 *
 * Responsibilities:
 * - Allow access only when the user is NOT authenticated
 * - Redirect authenticated users to the dashboard
 * - Show a full-page loader while session state is resolving
 *
 * Common use cases:
 * - Login page
 * - Forgot password
 * - Reset password
 */
const GuestRoute: FC<GuestRouteProps> = ({ children = <Outlet /> }) => {
  const { isAuthenticated } = useSession();

  /* ----------------------------------------
   * Authenticated users cannot access guest routes
   * -------------------------------------- */
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  /* ----------------------------------------
   * Guest access granted
   * -------------------------------------- */
  return <>{children}</>;
};

export default GuestRoute;
