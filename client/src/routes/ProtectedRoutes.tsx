import { FC, ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../hooks';
import { routes } from './index.ts';

interface ProtectedRoutesProps {
  children?: ReactNode; // Optional children
}

/**
 * ProtectedRoutes Component
 * Restricts access to authenticated users.
 * Redirects unauthenticated users to the login page, preserving their intended destination.
 * Can be extended for role-based or permission-based access control.
 */
const ProtectedRoutes: FC<ProtectedRoutesProps> = ({
  children = <Outlet />,
}) => {
  const { isAuthenticated } = useSession();
  const location = useLocation(); // Capture current location for redirect after login

  // Get public routes from the routes configuration
  const publicPaths = routes
    .filter((route) => !route.meta?.requiresAuth)
    .map((route) => route.path);

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect authenticated users to /dashboard if accessing invalid paths
  if (isAuthenticated && publicPaths.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated, render children or Outlet for nested routes
  return children;
};

export default ProtectedRoutes;
