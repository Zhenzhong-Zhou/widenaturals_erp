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
import { sidebarStyles } from './sidebarStyles';
import { useThemeContext } from '../../context/ThemeContext';
import logoDark from '../../assets/wide-logo-dark.png';
import logoLight from '../../assets/wide-logo-light.png';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { theme } = useThemeContext();
  const logo = theme.palette.mode === 'dark' ? logoDark : logoLight;
  
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
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '80px',
            padding: theme.spacing(2),
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%', // Ensure it takes up the full height
              width: '100%',  // Ensure it takes up the full width
            }}
          >
            <img
              src={logo}
              alt="Company Logo"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: isOpen ? '50px' : '80px', // Adjust maximum height dynamically
                objectFit: 'contain', // Ensures the image maintains aspect ratio
              }}
            />
          </Box>
          
          {isOpen && (
            <IconButton
              onClick={toggleSidebar}
              aria-label="Close Sidebar"
              sx={{
                marginLeft: 'auto',
              }}
            >
              <FontAwesomeIcon
                icon={faTimes}
                style={{
                  color: theme.palette.text.primary,
                }}
              />
            </IconButton>
          )}
        </Box>
        
        {/* Sidebar Navigation */}
        <Box
          sx={{
            padding: theme.spacing(2),
            backgroundColor: theme.palette.background.default,
            height: '100%',
            width: '240px',
            color: theme.palette.text.primary,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
            position: 'fixed',
            top: theme.spacing(2),
            left: theme.spacing(2),
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[1],
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
