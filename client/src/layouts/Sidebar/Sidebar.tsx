import { FC } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { sidebarStyles } from './sidebarStyles';
import { useThemeContext } from '../../context/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { theme, darkMode } = useThemeContext();
  
  return (
    <>
      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleSidebar}
        variant="persistent"
        sx={sidebarStyles(theme, darkMode, isOpen)}
      >
        {/* Sidebar Header */}
        <Box  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
          <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Company Name</Box>
          <IconButton onClick={toggleSidebar}>
            <FontAwesomeIcon icon={faTimes} style={{ color: darkMode ? 'white' : 'black' }} />
          </IconButton>
        </Box>
        
        {/* Sidebar Navigation */}
        {/* Sidebar Navigation */}
        <Box className="sidebar">
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/inventory">Inventory</a></li>
            <li><a href="/orders">Orders</a></li>
            <li><a href="/reports">Reports</a></li>
            <li><a href="/settings">Settings</a></li>
          </ul>
        </Box>
      </Drawer>
      
      {/* Open Button */}
      {!isOpen && (
        <IconButton
          onClick={toggleSidebar}
          sx={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1300 }}
        >
          <FontAwesomeIcon icon={faBars} style={{ color: darkMode ? 'white' : 'black' }} />
        </IconButton>
      )}
    </>
  );
};

export default Sidebar;
