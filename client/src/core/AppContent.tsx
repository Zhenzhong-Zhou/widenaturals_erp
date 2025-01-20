import { FC } from 'react';
import Box from '@mui/material/Box';
import { useInitializeApp } from '../hooks';
import AppRoutes from '../routes/AppRoutes.tsx';
import { Loading, ErrorDisplay } from '@components/index.ts';

/**
 * AppContent Component
 * Manages global initialization and renders routes based on authentication status.
 */
const AppContent: FC = () => {
  // Initialize the app with global loading
  const { isInitializing, hasError, initializationError } = useInitializeApp({
    delay: 500,
    retryAttempts: 3,
  });

  // Show loading during initialization
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
        <Loading message="Initializing application..." />
      </Box>
    );
  }

  // Show error if initialization fails
  if (hasError) {
    return (
      <ErrorDisplay
        message={
          initializationError?.message ||
          'An unexpected error occurred during initialization.'
        }
        onRetry={() => window.location.reload()}
      >
        Additional debugging information can go here.
      </ErrorDisplay>
    );
  }

  // Render routes
  return (
    <Box className="app">
      <AppRoutes />
    </Box>
  );
};

export default AppContent;
