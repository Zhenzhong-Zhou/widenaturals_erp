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
import { headerStyles, typographyStyles } from '@layouts/Header/headerStyles';

interface HeaderProps {
  fullName?: string;
  onLogout: () => void;
}

const Header: FC<HeaderProps> = ({ fullName, onLogout }) => {
  const { theme, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  const initial = useMemo(
    () => fullName?.charAt(0).toUpperCase() ?? 'G',
    [fullName]
  );
  
  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => setAnchorEl(null);
  
  return (
    <Box
      sx={{
        ...headerStyles(theme),
        display: 'flex',
        alignItems: 'center',
        height: 64,
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
        <HealthStatus sx={{ ml: 'auto' }} />
        
        <CustomButton
          variant="outlined"
          aria-label="Toggle theme"
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
          aria-label="User menu"
          title={fullName ?? 'Guest'}
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
              {fullName || 'Guest'}
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
