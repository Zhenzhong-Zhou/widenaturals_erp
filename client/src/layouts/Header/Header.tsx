import { type FC, type MouseEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import { HealthStatus } from '@features/health/components';
import { useThemeContext } from '@context/ThemeContext';
import { useLogout, useSession } from '@hooks/index';
import { headerStyles, typographyStyles } from '@layouts/Header/headerStyles';

/**
 * Application header.
 *
 * Displays branding, system health, theme toggle,
 * and user profile actions.
 */
const Header: FC = () => {
  const { theme, toggleTheme } = useThemeContext();
  const { user } = useSession();
  const { logout } = useLogout();
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  const fullName = user?.fullName ?? 'Guest';
  
  const initial = useMemo(
    () => fullName.charAt(0).toUpperCase(),
    [fullName]
  );
  
  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };
  
  const handleLogoutClick = () => {
    handleMenuClose();
    void logout();
  };
  
  return (
    <Box
      sx={{
        ...headerStyles(theme),
        display: 'flex',
        alignItems: 'center',
        height: 80,
        px: 5,
        py: 1.5,
        gap: 2,
      }}
    >
      {/* Brand */}
      <CustomTypography
        variant="h6"
        sx={{
          ...typographyStyles(theme),
          fontWeight: 700,
          color: theme.palette.primary.main,
          minWidth: 200,
        }}
      >
        WIDE Naturals Inc.
      </CustomTypography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
        <HealthStatus />
        
        <CustomButton
          variant="outlined"
          onClick={toggleTheme}
          sx={{ minWidth: 120, gap: 1, mr: 2 }}
        >
          <FontAwesomeIcon
            icon={theme.palette.mode === 'dark' ? faSun : faMoon}
          />
          {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode
        </CustomButton>
        
        <IconButton
          onClick={handleMenuOpen}
          title={fullName}
          size="small"
          sx={{ border: `2px solid ${theme.palette.primary.main}` }}
        >
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {initial}
          </Avatar>
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: { elevation: 3, sx: { width: 200, borderRadius: 2 } },
          }}
        >
          <MenuItem disabled>
            <CustomTypography variant="body1">
              {fullName}
            </CustomTypography>
          </MenuItem>
          
          <Divider />
          
          <MenuItem
            onClick={handleProfileClick}
          >
            Profile
          </MenuItem>
          
          <MenuItem
            onClick={handleLogoutClick}
          >
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
