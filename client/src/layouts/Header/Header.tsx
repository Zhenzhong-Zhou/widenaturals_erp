import { FC } from 'react';
import Box from '@mui/material/Box';
import { Typography, CustomButton } from '@components/index';
import { useThemeContext } from '../../context/ThemeContext';
import { headerStyles, userInfoStyles, typographyStyles } from './headerStyles';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  isSidebarOpen: boolean;
}

const Header: FC<HeaderProps> = ({ username, onLogout, isSidebarOpen }) => {
  const { theme, toggleTheme } = useThemeContext(); // Access theme and toggle function
  
  return (
    <Box sx={headerStyles(theme)}> {/* Apply header styles */}
      {/* Application Title */}
      <Typography sx={{
        fontSize: theme.typography.h3,
        flexGrow: 1,
        marginLeft: isSidebarOpen ? '10px' : theme.spacing(7),
      }}>
        WIDE Naturals Inc.
      </Typography>
      
      {/* User Information and Actions */}
      <Box sx={userInfoStyles(theme)}>
        <Typography variant="body1" sx={typographyStyles(theme)}>
          User: <strong>{username}</strong>
        </Typography>
        
        {/* Theme Toggle Button */}
        <CustomButton
          variant="outlined"
          onClick={toggleTheme}
          sx={{
            marginLeft: theme.spacing(2),
            borderColor: theme.palette.primary.main,
          }}
        >
          Switch to {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode
        </CustomButton>
        
        {/* Logout Button */}
        <CustomButton
          variant="contained"
          color="primary"
          onClick={onLogout}
          sx={{ marginLeft: theme.spacing(2) }}
        >
          Logout
        </CustomButton>
      </Box>
    </Box>
  );
};

export default Header;
