import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { useMediaQuery, useTheme } from '@mui/material';
import { useThemeContext } from '@context/ThemeContext';
import Sidebar from '@layouts/Sidebar/Sidebar';
import Header from '@layouts/Header/Header';
import Footer from '@layouts/Footer/Footer';
import {
  contentContainerStyles,
  layoutStyles,
  mainContentStyles,
} from '@layouts/MainLayout/layoutStyles';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout
 *
 * Pure application layout shell.
 *
 * Responsibilities:
 * - Render application chrome (Sidebar, Header, Footer)
 * - Handle responsive layout behavior
 *
 * MUST NOT:
 * - Fetch data
 * - Perform app initialization
 * - Read session or permission state
 * - Contain error boundaries
 * - Inject props into children
 */
const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useThemeContext();
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [isSidebarOpen, setSidebarOpen] = useState(!isSmallScreen);

  useEffect(() => {
    setSidebarOpen(!isSmallScreen);
  }, [isSmallScreen]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <Box className="layout" sx={layoutStyles(theme)}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Content Container */}
      <Box className="content-container" sx={contentContainerStyles(theme)}>
        {/* Header */}
        <Header />

        {/* Main Content */}
        <Box sx={mainContentStyles(theme)}>{children}</Box>

        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;
