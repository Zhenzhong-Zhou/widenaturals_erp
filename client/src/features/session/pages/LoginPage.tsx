import { FC } from 'react';
import { Box } from '@mui/material';
import { Typography } from '@components/index.ts';
import LoginCard from '../components/LoginCard.tsx';
import { useThemeContext } from '../../../context/ThemeContext.tsx';
import logoDark from '../../../assets/wide-logo-dark.png';
import logoLight from '../../../assets/wide-logo-light.png';

const LoginPage: FC = () => {
  const { theme } = useThemeContext();
  const logo = theme.palette.mode === 'dark' ? logoDark : logoLight;
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // Push content closer to the top
        alignItems: 'center',
        height: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1c1c1c, #333333)'
          : 'linear-gradient(135deg, #f9f9f9, #e0e0e0)',
        padding: { xs: '10px', sm: '100px 20px' }, // More padding for top alignment
        animation: 'fadeIn 0.5s ease-in-out', // Apply fade-in animation
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {/* Company Logo and Welcome Text */}
      <Box
        sx={{
          textAlign: 'center',
          marginBottom: '20px', // Adjust margin for tighter spacing
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Wide Naturals Inc."
          sx={{
            width: '100px',
            height: '100px',
            marginBottom: '10px',
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
          }}
        >
          Welcome to Wide Naturals ERP
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '1.1rem',
            marginTop: '10px',
          }}
        >
          Your trusted platform for managing inventory, sales, and more.
        </Typography>
      </Box>
      
      {/* Login Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          marginTop: '20px', // Add margin to separate from the welcome text
        }}
      >
        <LoginCard
          title="Sign In"
          subtitle="Access your Wide Naturals dashboard to streamline operations."
        />
      </Box>
      
      {/* Support Links */}
      <Box
        sx={{
          marginTop: '15px',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 'bold',
              marginLeft: '5px',
            },
          }}
        >
          Forgot your password?
          <a href="/reset-password">Just for UI</a>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
