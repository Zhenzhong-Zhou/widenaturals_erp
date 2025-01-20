import { FC } from 'react';
import Box from '@mui/material/Box';
import { MainLayout } from '../layouts';
import { useInitializeApp } from '../hooks';
import AppRoutes from '../routes/AppRoutes.tsx';
import { Loading, ErrorDisplay } from '@components/index.ts';

const AppContent: FC = () => {
  // Initialize the app with global loading
  const { isInitializing, hasError, initializationError } = useInitializeApp({
    delay: 500,
    retryAttempts: 3,
  });
  
  if (isInitializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Loading message="Loading application..." />
      </Box>
    );
  }
  
  if (hasError) {
    return (
      <ErrorDisplay
        message={initializationError?.message || 'An unexpected error occurred during initialization.'}
        onRetry={() => window.location.reload()}
      >
        Additional debugging information can go here.
      </ErrorDisplay>
    );
  }
  
  return (
    <Box className="app">
      <MainLayout username="John Doe" onLogout={() => console.log('Logged out')}>
        <AppRoutes />
      </MainLayout>
    </Box>
  );
};

export default AppContent;
