import { FC, ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from '../store/storeHooks';
import { selectIsAuthenticated } from '../features/session/state/sessionSelectors.ts';

interface ProtectedRoutesProps {
  children?: ReactNode; // Optional children
}

/**
 * ProtectedRoutes Component
 * Restricts access to authenticated users.
 * Redirects unauthenticated users to the login page, preserving their intended destination.
 * Can be extended for role-based or permission-based access control.
 */
const ProtectedRoutes: FC<ProtectedRoutesProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation(); // Capture current location for redirect after login
  
  // Return routes based on authentication status
  return isAuthenticated ? (
    children || <Outlet />
    ) : (
      <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoutes;
