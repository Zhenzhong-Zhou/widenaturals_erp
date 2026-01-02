import type { FC, ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useSession from '@hooks/useSession';

interface ProtectedRoutesProps {
  children?: ReactNode;
}

/**
 * ProtectedRoutes
 *
 * Authentication guard only.
 *
 * Responsibilities:
 * - Redirect unauthenticated users to /login
 *
 * MUST NOT:
 * - Know about routes
 * - Know about permissions
 * - Infer public paths
 */
const ProtectedRoutes: FC<ProtectedRoutesProps> = ({
  children = <Outlet />,
}) => {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  // Optional: block while session is resolving
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoutes;
