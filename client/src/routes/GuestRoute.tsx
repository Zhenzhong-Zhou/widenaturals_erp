import { ReactNode, FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../hooks';

// Define props explicitly
interface GuestRouteProps {
  children?: ReactNode;
}

const GuestRoute: FC<GuestRouteProps> = ({ children = <Outlet /> }) => {
  const { isAuthenticated } = useSession(); // Fetch authentication status

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default GuestRoute;
