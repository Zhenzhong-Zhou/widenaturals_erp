import React from 'react';
import Container from '@mui/material/Container';
import { useNavigate } from 'react-router-dom';
import { Typography, CustomButton } from '@components/index';
import { useThemeContext } from '../context/ThemeContext.tsx';

const NotFoundPage: React.FC = () => {
  const { theme } = useThemeContext(); // Get theme from context
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate('/'); // Redirect to the home or desired route
  };
  
  return (
    <Container
      maxWidth="md"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // Move content upward
        height: '100vh',
        textAlign: 'center',
        paddingTop: '30vh', // Add top padding to push content upward
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          color: theme.palette.primary.main, // Use theme's primary color
        }}
      >
        404
      </Typography>
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          color: theme.palette.text.secondary, // Use theme's text color
        }}
      >
        Oops! The page you are looking for doesn’t exist.
      </Typography>
      <CustomButton
        variant="contained"
        size="large"
        onClick={handleGoHome}
        sx={{
          textTransform: 'none',
          color: theme.palette.text.primary, // Button text color
          backgroundColor: theme.palette.primary.main, // Button background color
          '&:hover': {
            backgroundColor: theme.palette.primary.dark, // Button hover state
          },
        }}
      >
        Go Back to Home
      </CustomButton>
    </Container>
  );
};

export default NotFoundPage;
