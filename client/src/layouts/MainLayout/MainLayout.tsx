import {
  ReactNode,
  useState,
  Suspense,
  cloneElement,
  ReactElement,
} from 'react';
import { Sidebar, Header, Footer } from '../index';
import { useThemeContext } from '../../context/ThemeContext';
import Box from '@mui/material/Box';
import {
  layoutStyles,
  contentContainerStyles,
  mainContentStyles,
} from './layoutStyles';
import {
  ErrorDisplay,
  ErrorMessage,
  FallbackUI,
  Loading,
  ModuleErrorBoundary,
} from '@components/index';
import { AppError } from '@utils/AppError';
import { getErrorLog } from '@utils/errorUtils';
import { useLogout, useTokenRefresh, useUserProfile } from '../../hooks';
import { usePermissionsContext } from '../../context/PermissionsContext';

interface MainLayoutProps {
  children: ReactNode; // Allow any React elements to be passed as children
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { theme } = useThemeContext(); // Access the current theme from context
  const [isSidebarOpen, setSidebarOpen] = useState(true); // Sidebar state
  const {
    data: userProfile,
    loading: userProfileLoading,
    error: userProfileError,
  } = useUserProfile();
  const fullName = `${userProfile.firstname ?? ""} ${userProfile.lastname ?? ""}`.trim();
  const { logout } = useLogout(); // Logout handler
  useTokenRefresh(); // Token refresh handling
  const { roleName, permissions } = usePermissionsContext(); // Access role and permissions

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Handle global loading for user profile
  if (userProfileLoading) {
    return <Loading message="Loading user profile..." />;
  }

  // Handle global error for user profile
  if (userProfileError) {
    return <ErrorDisplay message="Failed to load user profile." />;
  }

  if (!userProfile) {
    return (
      <ErrorDisplay>
        <ErrorMessage message="No user profile available." />
      </ErrorDisplay>
    );
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
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          roleName={roleName}
          permissions={permissions}
        />
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
          <Suspense fallback={<Loading message="Loading header..." />}>
            <Header user={userProfile} onLogout={logout} />
          </Suspense>
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
          <Suspense fallback={<Loading message="Loading content..." />}>
            <Box sx={mainContentStyles(theme)}>
              {cloneElement(children as ReactElement, {
                fullName,
                roleName,
                permissions,
              })}
            </Box>
          </Suspense>
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
          <Suspense fallback={<Loading message="Loading footer..." />}>
            <Footer />
          </Suspense>
        </ModuleErrorBoundary>
      </Box>
    </Box>
  );
};

export default MainLayout;
