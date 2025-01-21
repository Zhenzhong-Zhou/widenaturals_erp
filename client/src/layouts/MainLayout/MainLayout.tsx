import { FC, ReactNode, useState } from 'react';
import { Sidebar, Header, Footer } from '../index';
import { useThemeContext } from '../../context/ThemeContext';
import Box from '@mui/material/Box';
import {
  layoutStyles,
  contentContainerStyles,
  mainContentStyles,
} from './layoutStyles';
import { ErrorDisplay, FallbackUI, Loading, ModuleErrorBoundary } from '@components/index';
import { AppError } from '@utils/AppError';
import { getErrorLog } from '@utils/errorUtils';
import { useLogout, useTokenRefresh, useUserProfile } from '../../hooks';

interface MainLayoutProps {
  children: ReactNode; // Allow any React elements to be passed as children
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useThemeContext(); // Access the current theme from context
  const [isSidebarOpen, setSidebarOpen] = useState(true); // Sidebar state
  const { user, loading, error } = useUserProfile(); // Fetch user profile
  const { logout } = useLogout(); // Logout handler
  useTokenRefresh();
  
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  
  if (loading) {
    return <Loading />;
  }
  
  if (error) {
    return <ErrorDisplay />;
  }
  
  if (!user) {
    return <div>No user profile available.</div>;
  }
  
  return (
    <Box className="layout" sx={layoutStyles(theme)}>
      {/* Sidebar */}
      <ModuleErrorBoundary
        fallback={
          <FallbackUI
            title="Sidebar Error"
            description="The sidebar failed to load. Please try refreshing the page or contact support."
            errorCode="SIDEBAR-001"
            errorLog={getErrorLog(
              AppError.fromNetworkError({
                url: '/api/sidebar',
                message: 'Sidebar API request failed',
              }).details
            )}
            onRetry={() => window.location.reload()}
          />
        }
      >
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </ModuleErrorBoundary>
      
      {/* Content Container */}
      <Box className="content-container" sx={contentContainerStyles(theme)}>
        {/* Header */}
        <ModuleErrorBoundary
          fallback={
            <FallbackUI
              title="Header Error"
              description="The header failed to load. Please try refreshing the page or contact support."
              errorCode="HEADER-001"
              errorLog={getErrorLog(
                AppError.fromValidationError({
                  message: 'Header props are missing',
                  component: 'Header',
                }).details
              )}
              onRetry={() => window.location.reload()}
            />
          }
        >
          <Header user={user?.data} onLogout={logout} />
        </ModuleErrorBoundary>
        
        {/* Main Content */}
        <ModuleErrorBoundary
          fallback={
            <FallbackUI
              title="Content Error"
              description="The main content failed to load. Please try again later."
              errorCode="CONTENT-001"
              errorLog={getErrorLog(
                AppError.fromNetworkError({
                  url: '/api/content',
                  message: 'Failed to fetch content data',
                }).details
              )}
            />
          }
        >
          <Box sx={mainContentStyles(theme)}>{children}</Box>
        </ModuleErrorBoundary>
        
        {/* Footer */}
        <ModuleErrorBoundary
          fallback={
            <FallbackUI
              title="Footer Error"
              description="The footer failed to load. Please try refreshing the page."
              errorCode="FOOTER-001"
              errorLog={getErrorLog(
                AppError.fromNetworkError({
                  url: '/api/footer',
                  message: 'Footer API request failed',
                }).details
              )}
              onRetry={() => window.location.reload()}
            />
          }
        >
          <Footer />
        </ModuleErrorBoundary>
      </Box>
    </Box>
  );
};

export default MainLayout;
