import { FC, ReactNode } from 'react';
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
  const { darkMode } = useThemeContext(); // Access dark mode from context
  
  return (
    <Box className="layout" sx={layoutStyles(darkMode)}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Content Container */}
      <Box className="content-container" sx={contentContainerStyles(darkMode)}>
        {/* Header */}
        <Header username={username} onLogout={onLogout} />
        
        {/* Main Content */}
        <Box sx={mainContentStyles()}>
          {children}
        </Box>
        
        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;
