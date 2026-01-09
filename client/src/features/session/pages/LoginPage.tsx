import { FC, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import LoginCard from '@features/session/components/LoginCard';
import { useLogin } from '@hooks/index';
import { useLoginForm } from '@features/session/hooks';
import logoDark from '@assets/wide-logo-dark.png';
import logoLight from '@assets/wide-logo-light.png';
import { useAppDispatch } from '@store/storeHooks';
import { resetLogin } from '@features/session/state/loginSlice';

const LoginPage: FC = () => {
  const theme = useTheme();
  const logo = theme.palette.mode === 'dark' ? logoDark : logoLight;
  const dispatch = useAppDispatch();
  
  // -----------------------------
  // Async login state
  // -----------------------------
  const {
    loading: isLoggingIn,
    error: loginError,
    submit: login,
  } = useLogin();
  
  // -----------------------------
  // Form state + validation
  // -----------------------------
  const {
    values: formValues,
    errors: formErrors,
    handleChange: handleFormChange,
    handleSubmit: handleFormSubmit,
  } = useLoginForm(login);
  
  useEffect(() => {
    dispatch(resetLogin());
  }, [dispatch]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        minHeight: '100dvh',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #161616, #262626)'
            : 'linear-gradient(135deg, #fafafa, #eaeaea)',
        px: 2,
        pt: { xs: 2, sm: 6 },
        pb: { xs: 4, sm: 6 },
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
      
      {/* Login Card (presentation only) */}
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <LoginCard
          title="Sign In"
          subtitle="Access your dashboard to streamline operations."
          loading={isLoggingIn}
          error={loginError}
          formValues={formValues}
          formErrors={formErrors}
          onFormChange={handleFormChange}
          onFormSubmit={handleFormSubmit}
        />
      </Box>
      
      {/* Support Links */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <CustomTypography variant="body2" color="text.secondary">
          Forgot your password?{' '}
          <Box
            component="a"
            href="/reset-password"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Reset it here
          </Box>
        </CustomTypography>
      </Box>
    </Box>
  );
};

export default LoginPage;
