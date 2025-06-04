import {
  useState,
  Suspense,
  cloneElement,
  type ReactElement,
  useEffect,
  isValidElement,
  useMemo,
} from 'react';
import { useThemeContext } from '@context/ThemeContext';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import ModuleErrorBoundaryWrapper from '@components/shared/ModuleErrorBoundaryWrapper';
import FallbackUI from '@components/shared/FallbackUI';
import Sidebar from '@layouts/Sidebar/Sidebar';
import Header from '@layouts/Header/Header';
import Footer from '@layouts/Footer/Footer';
import { AppError } from '@utils/AppError';
import { getErrorLog } from '@utils/errorUtils';
import { usePermissionsContext } from '@context/PermissionsContext';
import useUserProfile from '@hooks/useUserProfile';
import useLogout from '@hooks/useLogout';
import useTokenRefresh from '@hooks/useTokenRefresh';
import {
  contentContainerStyles,
  layoutStyles,
  mainContentStyles,
} from '@layouts/MainLayout/layoutStyles';

interface InjectedProps {
  fullName: string;
  roleName: string;
  permissions: string[];
}

interface MainLayoutProps {
  children: ReactElement<InjectedProps>;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { theme } = useThemeContext();
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('md')); // Change breakpoint as needed

  const [isSidebarOpen, setSidebarOpen] = useState(!isSmallScreen); // Open if large screen, close if small screen

  const {
    data: userProfile,
    loading: userProfileLoading,
    error: userProfileError,
  } = useUserProfile();
  const fullName =
    `${userProfile.firstname ?? ''} ${userProfile.lastname ?? ''}`.trim();
  const { logout } = useLogout();
  useTokenRefresh();
  const { roleName, permissions } = usePermissionsContext();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    setSidebarOpen(!isSmallScreen); // Automatically adjust sidebar state based on screen size
  }, [isSmallScreen]);

  const injectedChild = useMemo(() => {
    return isValidElement(children)
      ? cloneElement(children, { fullName, roleName, permissions })
      : null;
  }, [children, fullName, roleName, permissions]);

  if (userProfileLoading) {
    return <Loading fullPage={true} message="Loading user profile..." />;
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
      <ModuleErrorBoundaryWrapper
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
        <Suspense fallback={<Loading message="Loading sidebar..." />}>
          <Sidebar
            isOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            roleName={roleName}
            permissions={permissions}
          />
        </Suspense>
      </ModuleErrorBoundaryWrapper>

      {/* Content Container */}
      <Box className="content-container" sx={contentContainerStyles(theme)}>
        {/* Header */}
        <ModuleErrorBoundaryWrapper
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
        </ModuleErrorBoundaryWrapper>

        {/* Main Content */}
        <ModuleErrorBoundaryWrapper
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
            <Box sx={mainContentStyles(theme)}>{injectedChild}</Box>
          </Suspense>
        </ModuleErrorBoundaryWrapper>

        {/* Footer */}
        <ModuleErrorBoundaryWrapper
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
        </ModuleErrorBoundaryWrapper>
      </Box>
    </Box>
  );
};

export default MainLayout;
