import { FC, ReactNode, useState } from 'react';
import { Sidebar, Header, Footer } from '../index';
import { useThemeContext } from '../../context/ThemeContext'; // Import the context
import Box from '@mui/material/Box';
import { layoutStyles, contentContainerStyles, mainContentStyles } from './layoutStyles';

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
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Content Container */}
      <Box className="content-container" sx={contentContainerStyles(theme)}>
        {/* Header */}
        <Header username={username} onLogout={onLogout} isOpenSidebar={false} />
        
        {/* Main Content */}
        <Box sx={mainContentStyles(theme)}>{children}</Box>
        
        {/* Footer */}
        <Footer isSidebarOpen={false} />
      </Box>
    </Box>
  );
};

export default MainLayout;
