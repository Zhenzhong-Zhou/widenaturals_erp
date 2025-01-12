import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useThemeContext } from '../../context/ThemeContext'; // Assuming the ThemeContext is correctly set up
import { headerStyles, userInfoStyles, typographyStyles } from './headerStyles'; // Assuming headerStyles is abstracted properly

interface HeaderProps {
  username: string;
  onLogout: () => void;
  isOpenSidebar: boolean; // Sidebar state
}

const Header: FC<HeaderProps> = ({ username, onLogout, isOpenSidebar }) => {
  const { theme, toggleTheme } = useThemeContext(); // Access theme and toggle function
  
  return (
    <Box sx={headerStyles(theme, isOpenSidebar)}> {/* Apply header styles */}
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        ERP System
      </Typography>
      
      <Box sx={userInfoStyles(theme)}>
        <Typography variant="body1" sx={typographyStyles(theme)}>
          User: {username}
        </Typography>
        
        {/* Toggle Theme Button */}
        <Button
          variant="outlined"
          onClick={toggleTheme}
          sx={{
            marginLeft: 2,
            color: theme.palette.text.primary,
            borderColor: theme.palette.primary.main,
          }}
        >
          Switch to {theme.palette.mode === 'dark' ? 'Light' : 'Dark'} Mode
        </Button>
        
        {/* Logout Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={onLogout}
          sx={{ marginLeft: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Header;
