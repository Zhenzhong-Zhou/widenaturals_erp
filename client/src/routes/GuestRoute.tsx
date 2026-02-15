import type { FC, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@features/session/hooks';

interface GuestRouteProps {
  /** Optional children; defaults to <Outlet /> for nested routes */
  children?: ReactNode;
}

/**
 * GuestRoute
 *
 * Route guard for unauthenticated (guest) access only.
 *
 * Responsibilities:
 * - Allow rendering only when the user is not authenticated
 * - Redirect authenticated users to the application entry route
 * - Defer rendering until the session resolution phase completes
 *
 * Explicitly out of scope:
 * - Authentication or login logic
 * - Authorization or permission checks
 * - Route inference or dynamic redirect decisions
 *
 * Notes:
 * - While the session state is resolving, no UI is rendered
 *   to avoid redirect flicker
 * - This guard assumes session bootstrap is managed externally
 */
const GuestRoute: FC<GuestRouteProps> = ({ children = <Outlet /> }) => {
  const { isAuthenticated, resolving } = useSession();

  // Block rendering during session resolution to prevent redirect flicker
  if (resolving) {
    return null;
  }

  // Authenticated users cannot access guest routes
  if (isAuthenticated) {
    // Always send authenticated users to app entry
    return <Navigate to="/dashboard" replace />;
  }

  // Guest access granted
  return <>{children}</>;
};

export default GuestRoute;
