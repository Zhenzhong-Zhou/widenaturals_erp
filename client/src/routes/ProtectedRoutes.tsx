import type { FC, ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import useSession from '@hooks/useSession';
import { routes } from './index';
import Loading from '@components/common/Loading';

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
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation(); // Capture current location for redirect after login
  
  // If session is still being validated, show loading to prevent layout shift
  if (isLoading) {
    return <Loading fullPage message="Checking authentication..." />;
  }
  
  
  // Get public routes from the routes configuration
  const publicPaths = routes
    .filter((route) => !route.meta?.requiresAuth)
    .map((route) => route.path);

  // Redirect unauthenticated users to login
  const isPublicPath = publicPaths.includes(location.pathname);
  
  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect authenticated users to /dashboard if accessing invalid paths
  if (isAuthenticated && isPublicPath) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated, render children or Outlet for nested routes
  return children;
};

export default ProtectedRoutes;
