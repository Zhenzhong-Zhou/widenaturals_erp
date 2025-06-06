import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import LoginCard from '@features/session/components/LoginCard';
import { useThemeContext } from '@context/ThemeContext';
import logoDark from '@assets/wide-logo-dark.png';
import logoLight from '@assets/wide-logo-light.png';

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
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1c1c1c, #333333)'
            : 'linear-gradient(135deg, #f9f9f9, #e0e0e0)',
        padding: { xs: '10px', sm: '50px 20px' },
        animation: 'fadeIn 0.5s ease-in-out',
      }}
    >
      {/* Branding */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          component="img"
          src={logo}
          alt="Company Logo"
          sx={{ mb: 2, width: 100, height: 100 }}
        />
        <CustomTypography
          variant="h4"
          sx={{ fontWeight: 'bold', color: 'text.primary' }}
        >
          Welcome to Wide Naturals ERP
        </CustomTypography>
        <CustomTypography
          variant="body1"
          sx={{ color: 'text.secondary', mt: 1 }}
        >
          Manage your inventory, sales, and operations efficiently.
        </CustomTypography>
      </Box>

      {/* Login Card */}
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <LoginCard
          title="Sign In"
          subtitle="Access your dashboard to streamline operations."
        />
      </Box>

      {/* Support Links */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <CustomTypography variant="body2" sx={{ color: 'text.secondary' }}>
          Forgot your password?{' '}
          <a
            href="/reset-password"
            style={{ color: 'primary.main', fontWeight: 'bold' }}
          >
            Reset it here
          </a>
        </CustomTypography>
      </Box>
    </Box>
  );
};

export default LoginPage;
