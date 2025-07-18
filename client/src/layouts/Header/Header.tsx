import { type FC, type MouseEvent, useState } from 'react';
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
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'unhealthy':
        return 'error';
      case 'loading':
        return 'info'; // optional, or 'default'
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        ...headerStyles(theme),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 5, // Padding for spacing from sidebar
        py: 1.5,
        gap: 2,
      }}
    >
      {/* Left: Brand */}
      <CustomTypography
        variant="h6"
        sx={{
          ...typographyStyles(theme),
          fontWeight: 700,
          fontFamily: "'Roboto', sans-serif",
          color: theme.palette.primary.main,
          minWidth: 200,
        }}
      >
        WIDE Naturals Inc.
      </CustomTypography>

      {/* Right: Status, Theme, Avatar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          ml: 'auto',
        }}
      >
        {/* Server Health */}
        <HealthStatus getStatusColor={getStatusColor} sx={{ ml: 'auto' }} />

        {/* Theme Toggle */}
        <CustomButton
          variant="outlined"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          sx={{
            fontWeight: 500,
            fontSize: '0.875rem',
            minWidth: 120,
            px: 2,
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mr: 2,
          }}
        >
          <FontAwesomeIcon
            icon={theme.palette.mode === 'dark' ? faSun : faMoon}
          />
          {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode
        </CustomButton>

        {/* Avatar & Menu */}
        <IconButton
          onClick={handleMenuOpen}
          aria-label="User menu"
          size="small"
          sx={{
            ml: 0,
            border: `2px solid ${theme.palette.primary.main}`,
          }}
        >
          <Avatar
            alt={user?.firstname || 'Guest'}
            src={''}
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 36,
              height: 36,
              fontWeight: 600,
              fontFamily: "'Roboto', sans-serif",
            }}
          >
            {user?.firstname?.charAt(0).toUpperCase() || 'G'}
          </Avatar>
        </IconButton>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              elevation: 3,
              sx: { width: 200, borderRadius: 2 },
            },
          }}
        >
          <MenuItem disabled>
            <CustomTypography variant="body1">
              {user?.firstname || 'Guest'}
            </CustomTypography>
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate('/profile');
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
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Header;
