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
  const { theme } = useThemeContext();
  
  return (
    <>
      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleSidebar}
        variant="persistent"
        sx={sidebarStyles(theme, isOpen)}
      >
        {/* Sidebar Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Company Name</Box>
          <IconButton onClick={toggleSidebar}>
            <FontAwesomeIcon
              icon={faTimes}
              style={{ color: theme.palette.text.primary }}
            />
          </IconButton>
        </Box>
        
        {/* Sidebar Navigation */}
        <Box
          className="sidebar"
          sx={{
            padding: '16px',
            backgroundColor: theme.palette.background.default,
            height: '100%',
            color: theme.palette.text.primary,
          }}
        >
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><a href="/dashboard" style={{ color: theme.palette.text.primary }}>Dashboard</a></li>
            <li><a href="/inventory" style={{ color: theme.palette.text.primary }}>Inventory</a></li>
            <li><a href="/orders" style={{ color: theme.palette.text.primary }}>Orders</a></li>
            <li><a href="/reports" style={{ color: theme.palette.text.primary }}>Reports</a></li>
            <li><a href="/settings" style={{ color: theme.palette.text.primary }}>Settings</a></li>
          </ul>
        </Box>
      </Drawer>
      
      {/* Open Button */}
      {!isOpen && (
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 1300,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <FontAwesomeIcon icon={faBars} />
        </IconButton>
      )}
    </>
  );
};

export default Sidebar;
