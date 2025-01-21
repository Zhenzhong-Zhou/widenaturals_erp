import React, { FC, useState } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { Typography, CustomButton } from '@components/index';
import { useThemeContext } from '../../context/ThemeContext';
import { UserProfile as UserProfileType } from '../../features/user/state/userTypes';
import { headerStyles, typographyStyles } from './headerStyles';
import { HealthStatus } from '../../features/health';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  user?: UserProfileType;
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
      case 'Online':
        return 'success';
      case 'Maintenance':
        return 'warning';
      case 'Offline':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Box sx={headerStyles(theme)}>
      {/* Application Title */}
      <Typography variant="h6" sx={typographyStyles(theme)}>
        WIDE Naturals Inc.
      </Typography>
      
      {/* Server Status */}
      <HealthStatus getStatusColor={getStatusColor}/>
      
      {/* Theme Toggle Button */}
      <CustomButton
        variant="outlined"
        onClick={toggleTheme}
        sx={{ marginRight: 2 }}
      >
        <FontAwesomeIcon icon={theme.palette.mode === 'dark' ? faSun : faMoon} />
        {theme.palette.mode === 'dark' ? ' Light' : ' Dark'} Mode
      </CustomButton>
      
      {/* User Avatar and Menu */}
      <IconButton onClick={handleMenuOpen}>
        <Avatar
          alt={user?.firstname || 'Guest'}
          src={user?.avatar || ''}
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
          <Typography variant="body1">
            {user?.firstname || 'Guest'}
          </Typography>
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
        <MenuItem onClick={() => { handleMenuClose(); onLogout(); }}>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Header;
