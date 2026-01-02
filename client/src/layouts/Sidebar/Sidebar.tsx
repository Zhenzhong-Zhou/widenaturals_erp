import { FC, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
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
import { usePermissionsContext } from '@context/PermissionsContext';
import logoDark from '@assets/wide-logo-dark.png';
import logoLight from '@assets/wide-logo-light.png';
import { navigationItems } from '@routes/index';
import { hasPermission } from '@utils/permissionUtils';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * Sidebar
 *
 * Responsibilities:
 * - Render navigation links
 * - Filter routes based on permissions
 * - Handle responsive open / close
 *
 * MUST NOT:
 * - Fetch data
 * - Control auth lifecycle
 */
const Sidebar: FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { theme } = useThemeContext();
  const { roleName, permissions } = usePermissionsContext();
  
  const logo = theme.palette.mode === 'dark' ? logoDark : logoLight;
  
  // --------------------------------------------------
  // Filter routes once per permission change
  // --------------------------------------------------
  const menuItems = useMemo(() => {
    return navigationItems.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(item.requiredPermission, permissions, roleName);
    });
  }, [permissions, roleName]);
  
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
        {/* Header */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 80,
            padding: theme.spacing(2),
            px: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              alignItems: 'center',
            }}
          >
            <img
              src={logo}
              alt="WIDE Naturals Inc."
              loading="eager"
              style={{ height: 50, objectFit: 'contain' }}
            />
          </Box>
          
          {isOpen && (
            <IconButton
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              sx={{ ml: 'auto' }}
              >
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          )}
        </Box>
        
        {/* Navigation */}
        <Box
          sx={{
            p: 2,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  end={item.exact}
                  onClick={toggleSidebar}
                  sx={{
                    borderRadius: theme.shape.borderRadius,
                    px: 2,
                    py: 1.2,
                    color: theme.palette.text.primary,
                    '&.active': {
                      backgroundColor: theme.palette.action.selected,
                      fontWeight: 600,
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText
                    primary={item.title}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.95rem',
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
          aria-label="Open sidebar"
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[1],
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <FontAwesomeIcon icon={faBars} />
        </IconButton>
      )}
    </>
  );
};

export default Sidebar;
