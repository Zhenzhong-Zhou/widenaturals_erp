import type { FC } from 'react';
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
import { useThemeContext } from '@context/ThemeContext';
import logoDark from '@assets/wide-logo-dark.png';
import logoLight from '@assets/wide-logo-light.png';
import { routes } from '@routes/index';
import { hasPermission } from '@utils/permissionUtils';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  roleName: string;
  permissions: string[];
}

const Sidebar: FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  roleName,
  permissions,
}) => {
  const { theme } = useThemeContext();
  const logo = theme.palette.mode === 'dark' ? logoDark : logoLight;

  // Filter routes for sidebar
  const menuItems = routes.filter((route) => {
    const requiredPermission = route.meta?.requiredPermission || '';
    return (
      route.meta?.showInSidebar &&
      !route.path.includes('*') &&
      (requiredPermission === '' ||
        hasPermission(requiredPermission, permissions, roleName))
    );
  });

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
        {/* Header with logo and close */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 80,
            padding: theme.spacing(2),
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={logo}
              alt="WIDE Naturals Inc."
              loading="eager" // LCP optimization
              style={{
                height: '50px',
                objectFit: 'contain',
                fontFamily: "'Roboto', sans-serif", // FOUT prevention
              }}
            />
          </Box>

          {isOpen && (
            <IconButton
              onClick={toggleSidebar}
              aria-label="Close Sidebar"
              sx={{ ml: 'auto' }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          )}
        </Box>

        {/* Sidebar links */}
        <Box
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.default,
            height: '100%',
            width: 240,
            color: theme.palette.text.primary,
            display: 'flex',
            flexDirection: 'column',
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
                    px: 2,
                    py: 1.2,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText
                    primary={item.meta?.title}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Mobile open button */}
      {!isOpen && (
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[1],
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
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
