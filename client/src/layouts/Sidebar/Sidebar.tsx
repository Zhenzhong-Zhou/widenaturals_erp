import { FC } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
// import { Typography } from '@components/index';
import { sidebarStyles } from './sidebarStyles';
import { useThemeContext } from '../../context/ThemeContext';
import logo from '../../assets/wide-logo.png';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { theme } = useThemeContext();
  
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Orders', path: '/orders' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ];
  
  return (
    <>
      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleSidebar}
        variant="persistent" // Persistent drawer for desktop
        sx={sidebarStyles(theme, isOpen)}
      >
        {/* Sidebar Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '80px',
            padding: theme.spacing(2),
            backgroundColor: theme.palette.background.paper,
          }}
        >
          
          {isOpen ? (
            <>
            </>
          ) : (
            <img
              src={logo}
              alt="Company Logo"
              style={{
                width: '500px',
                height: '500px',
              }}
            />
          )}
          {isOpen && (
            <IconButton onClick={toggleSidebar} aria-label="Close Sidebar">
              <FontAwesomeIcon
                icon={faTimes}
                style={{ color: theme.palette.text.primary }}
              />
            </IconButton>
          )}
          {/*<Box sx={{ fontSize: theme.typography.h6.fontSize, fontWeight: 'bold' }}>*/}
          {/*  WIDE Naturals Inc.*/}
          {/*</Box>*/}
          {/*<IconButton onClick={toggleSidebar} aria-label="Close Sidebar">*/}
          {/*  <FontAwesomeIcon*/}
          {/*    icon={faTimes}*/}
          {/*    style={{ color: theme.palette.text.primary }}*/}
          {/*  />*/}
          {/*</IconButton>*/}
        </Box>
        
        {/* Sidebar Navigation */}
        <Box
          className="sidebar"
          sx={{
            padding: theme.spacing(2),
            backgroundColor: theme.palette.background.default,
            height: '100%',
            color: theme.palette.text.primary,
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.path}
                  sx={{
                    borderRadius: theme.shape.borderRadius,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* Open Button */}
      {!isOpen && (
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'fixed', // Use fixed positioning to avoid layout interference
            top: theme.spacing(2),
            left: theme.spacing(2),
            zIndex: theme.zIndex.drawer + 1, // Ensure it stays above other elements
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[1], // Optional: Add a subtle shadow
          }}
          aria-label="Open Sidebar"
        >
          <FontAwesomeIcon icon={faBars} />
        </IconButton>
      )}
    </>
  );
};

export default Sidebar;
