import {
  useState,
  useEffect,
  useMemo,
  cloneElement,
  isValidElement,
  type ReactElement,
} from 'react';
import Box from '@mui/material/Box';
import { useMediaQuery, useTheme } from '@mui/material';
import { useThemeContext } from '@context/ThemeContext';
import { usePermissionsContext } from '@context/PermissionsContext';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ModuleErrorBoundaryWrapper from '@components/shared/ModuleErrorBoundaryWrapper';
import FallbackUI from '@components/shared/FallbackUI';
import Sidebar from '@layouts/Sidebar/Sidebar';
import Header from '@layouts/Header/Header';
import Footer from '@layouts/Footer/Footer';
import {
  useLogout,
  useTokenRefresh,
  useUserSelfProfile,
  useUserSelfProfileAuto,
} from '@hooks/index';
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
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [isSidebarOpen, setSidebarOpen] = useState(!isSmallScreen);
  
  // --------------------------------------------------
  // App bootstrap
  // --------------------------------------------------
  useUserSelfProfileAuto();
  useTokenRefresh();
  
  const { logout } = useLogout();
  const { roleName, permissions } = usePermissionsContext();
  
  const {
    fullName,
    loading: isProfileLoading,
    error: profileError,
    isLoadingEmpty: isInitialProfileLoading,
  } = useUserSelfProfile();
  
  useEffect(() => {
    setSidebarOpen(!isSmallScreen);
  }, [isSmallScreen]);
  
  const injectedChild = useMemo(() => {
    return isValidElement(children)
      ? cloneElement(children, { fullName, roleName, permissions })
      : null;
  }, [children, fullName, roleName, permissions]);
  
  // --------------------------------------------------
  // Global loading / error gates
  // --------------------------------------------------
  if (isInitialProfileLoading) {
    return <Loading fullPage message="Preparing application..." />;
  }
  
  if (isProfileLoading) {
    return <Loading fullPage message="Loading user profile..." />;
  }
  
  if (profileError) {
    return <ErrorDisplay message="Failed to load user profile." />;
  }
  
  // --------------------------------------------------
  // Layout
  // --------------------------------------------------
  return (
    <Box className="layout" sx={layoutStyles(theme)}>
      {/* Sidebar */}
      <ModuleErrorBoundaryWrapper
        fallback={
          <FallbackUI
            title="Sidebar Error"
            description="The sidebar failed to load."
            errorCode="SIDEBAR-001"
            errorLog="Sidebar render failure"
          />
        }
      >
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setSidebarOpen((p) => !p)}
          roleName={roleName}
          permissions={permissions}
        />
      </ModuleErrorBoundaryWrapper>
      
      {/* Content Container */}
      <Box className="content-container" sx={contentContainerStyles(theme)}>
        {/* Header */}
        <ModuleErrorBoundaryWrapper
          fallback={
            <FallbackUI
              title="Header Error"
              description="The header failed to load."
              errorCode="HEADER-001"
              errorLog="Header render failure"
            />
          }
        >
          <Header fullName={fullName} onLogout={logout} />
        </ModuleErrorBoundaryWrapper>
        
        {/* Main Content */}
        <ModuleErrorBoundaryWrapper
          fallback={
            <FallbackUI
              title="Content Error"
              description="The main content failed to load."
              errorCode="CONTENT-001"
              errorLog="Main content render failure"
            />
          }
        >
          <Box sx={mainContentStyles(theme)}>
            {injectedChild}
          </Box>
        </ModuleErrorBoundaryWrapper>
        
        {/* Footer */}
        <ModuleErrorBoundaryWrapper
          fallback={
            <FallbackUI
              title="Footer Error"
              description="The footer failed to load."
              errorCode="FOOTER-001"
              errorLog="Footer render failure"
            />
          }
        >
          <Footer />
        </ModuleErrorBoundaryWrapper>
      </Box>
    </Box>
  );
};

export default MainLayout;
