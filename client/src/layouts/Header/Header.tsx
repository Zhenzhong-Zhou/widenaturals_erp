import { type FC, useState } from 'react';
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
import HealthStatus from '@features/health/components/HealthStatus';
import CustomButton from '@components/common/CustomButton';
import { useThemeContext } from '@context/ThemeContext';
import type { UserProfile } from '@features/user';
import { headerStyles, typographyStyles } from '@layouts/Header/headerStyles';

interface HeaderProps {
  user?: UserProfile;
  onLogout: () => void;
}

const Header: FC<HeaderProps> = ({ user, onLogout }) => {
  const { theme, toggleTheme } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'Maintenance':
        return 'warning';
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={headerStyles(theme)}>
      {/* Application Title */}
      <CustomTypography variant="h6" sx={typographyStyles(theme)}>
        WIDE Naturals Inc.
      </CustomTypography>

      {/* Server Status */}
      <HealthStatus getStatusColor={getStatusColor} />

      {/* Theme Toggle Button */}
      <CustomButton
        variant="outlined"
        onClick={toggleTheme}
        sx={{ marginRight: 2 }}
      >
        <FontAwesomeIcon
          icon={theme.palette.mode === 'dark' ? faSun : faMoon}
        />
        {theme.palette.mode === 'dark' ? ' Light' : ' Dark'} Mode
      </CustomButton>

      {/* User Avatar and Menu */}
      <IconButton onClick={handleMenuOpen}>
        <Avatar
          alt={user?.firstname || 'Guest'}
          src={''}
          sx={{ bgcolor: theme.palette.primary.main }}
        >
          {user?.firstname?.charAt(0) || 'G'}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 3, // Apply elevation to the Paper component
            sx: {
              width: 200, // Set width for the menu
            },
          },
        }}
      >
        <MenuItem>
          <CustomTypography variant="body1">
            {user?.firstname || 'Guest'}
          </CustomTypography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate('/profile'); // Navigate to profile page
          }}
        >
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onLogout();
          }}
        >
          <CustomTypography variant="body2">Logout</CustomTypography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Header;
