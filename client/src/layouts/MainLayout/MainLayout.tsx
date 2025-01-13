import { FC, ReactNode, useState } from 'react';
import { Sidebar, Header, Footer } from '../index';
import { useThemeContext } from '../../context/ThemeContext'; // Import the context
import Box from '@mui/material/Box';
import { layoutStyles, contentContainerStyles, mainContentStyles } from './layoutStyles';
import { FallbackUI, ModuleErrorBoundary } from '@components/index.ts';

interface MainLayoutProps {
  children: ReactNode;  // Allow any React elements to be passed as children
  username: string;     // Passing username to the layout
  onLogout: () => void; // Passing logout handler to the layout
}

const MainLayout: FC<MainLayoutProps> = ({ children, username, onLogout }) => {
  const { theme } = useThemeContext(); // Access the current theme from context
  const [isSidebarOpen, setSidebarOpen] = useState(true); // Sidebar state
  
  const toggleSidebar = () => setSidebarOpen((prev) => !prev); // Toggle sidebar state
  
  return (
    <Box className="layout" sx={layoutStyles(theme)}>
      {/* Sidebar */}
      <ModuleErrorBoundary
        fallback={
          <FallbackUI
            title="Sidebar Error"
            description="The sidebar failed to load. Please try refreshing the page or contact support."
            errorCode="SIDEBAR-001"
            errorLog="Sidebar module failed to initialize due to a dependency error."
            onRetry={() => window.location.reload()} // Retry logic
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
              errorLog="Header component could not render due to missing props."
              onRetry={() => window.location.reload()} // Retry logic
            />
          }
        >
          <Header username={username} onLogout={onLogout} />
        </ModuleErrorBoundary>
        
        {/* Main Content */}
        <ModuleErrorBoundary
          fallback={
            <FallbackUI
              title="Content Error"
              description="The main content failed to load. Please try again later."
              errorCode="CONTENT-001"
              errorLog="The main content area encountered a data fetch error from the API."
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
              errorLog="Footer component experienced a rendering issue."
              onRetry={() => window.location.reload()} // Retry logic
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
