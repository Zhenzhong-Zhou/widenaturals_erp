import type { ReactNode, FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useSession from '@hooks/useSession';
import Loading from '@components/common/Loading';

// Define props explicitly
interface GuestRouteProps {
  children?: ReactNode;
}

const GuestRoute: FC<GuestRouteProps> = ({ children = <Outlet /> }) => {
  const { isAuthenticated, isLoading } = useSession(); // Fetch authentication status

  // While checking session, show full-page loading to avoid layout shift
  if (isLoading) {
    return <Loading fullPage message="Checking session..." />;
  }
  
  // Redirect to dashboard if authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default GuestRoute;
