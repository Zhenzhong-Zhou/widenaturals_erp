import { FC } from 'react';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import CustomButton from '@components/common//CustomButton';
import Typography from '@components/common/Typography';
import { useThemeContext } from '@context/ThemeContext';

const HomePage: FC = () => {
  const { theme } = useThemeContext(); // Get theme from context
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <Box>
      <Typography>Welcome</Typography>
      <CustomButton
        variant="contained"
        size="large"
        onClick={handleRedirect}
        sx={{
          textTransform: 'none',
          color: theme.palette.text.primary, // Button text color
          backgroundColor: theme.palette.primary.main, // Button background color
          '&:hover': {
            backgroundColor: theme.palette.primary.dark, // Button hover state
          },
        }}
      >
        Login
      </CustomButton>
    </Box>
  );
};

export default HomePage;
