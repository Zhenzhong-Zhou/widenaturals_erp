import type { FC, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@features/session/hooks';

interface ProtectedRoutesProps {
  children?: ReactNode;
}

/**
 * ProtectedRoutes
 *
 * Authentication-only route guard.
 *
 * Responsibilities:
 * - Prevent rendering of protected routes when the user is unauthenticated
 * - Redirect unauthenticated users to the login page
 * - Defer rendering until session bootstrap is complete
 *
 * Explicitly out of scope:
 * - Authorization or permission checks
 * - Route ownership or path inference
 * - Redirect logic based on user role or context
 *
 * Notes:
 * - This guard assumes session state is managed externally
 *   via the session bootstrap layer
 * - While resolving or before bootstrap completion, no UI
 *   is rendered to avoid redirect flicker
 */
const ProtectedRoutes: FC<ProtectedRoutesProps> = ({
  children = <Outlet />,
}) => {
  const { isAuthenticated, resolving, bootstrapped } = useSession();

  // Block rendering until session bootstrap completes to avoid redirect flicker
  if (!bootstrapped || resolving) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoutes;
