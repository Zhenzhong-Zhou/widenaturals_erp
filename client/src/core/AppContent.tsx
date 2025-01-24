import { FC } from 'react';
import Box from '@mui/material/Box';
import { useInitializeApp, useValidateAndRefreshToken } from '../hooks';
import AppRoutes from '../routes/AppRoutes.tsx';
import { Loading, ErrorDisplay, ErrorMessage } from '@components/index.ts';

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

  // Validate and refresh token on initial load
  const { loading: isTokenRefreshing, error: tokenError } =
    useValidateAndRefreshToken();

  // Helper function to determine error message
  const getErrorMessage = (): string => {
    if (initializationError) {
      return (
        initializationError.message || 'Failed to initialize the application.'
      );
    }
    if (tokenError) {
      return tokenError;
    }
    return 'An unexpected error occurred.';
  };

  // Show critical error for initialization failure
  if (hasError) {
    return (
      <ErrorDisplay
        message={getErrorMessage()}
        onRetry={() => window.location.reload()}
      >
        <ErrorMessage message="Initialization failed. Please try reloading the page." />
      </ErrorDisplay>
    );
  }

  // Render the app while token refreshing happens in the background
  return (
    <Box className="app">
      {isInitializing && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.default',
            zIndex: 10,
          }}
        >
          <Loading message="Initializing application..." />
        </Box>
      )}

      {isTokenRefreshing && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'background.paper',
            padding: '8px 16px',
            borderRadius: '8px',
            boxShadow: 3,
          }}
        >
          <Loading message="Refreshing token..." variant="spinner" />
        </Box>
      )}

      <AppRoutes />
    </Box>
  );
};

export default AppContent;
