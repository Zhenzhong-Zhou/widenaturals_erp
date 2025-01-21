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
  const { loading: isTokenRefreshing, error: tokenError } = useValidateAndRefreshToken();
  
  // Helper function to determine error message
  const getErrorMessage = (): string => {
    if (initializationError) {
      return initializationError.message || 'Failed to initialize the application.';
    }
    if (tokenError) {
      return tokenError;
    }
    return 'An unexpected error occurred.';
  };
  
  // Show loading during initialization or token validation
  if (isInitializing || isTokenRefreshing) {
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
  
  // Show error if initialization or token validation fails
  if (hasError || tokenError) {
    const errorMessage = getErrorMessage();
    
    return (
      <ErrorDisplay
        message={errorMessage}
        onRetry={() => window.location.reload()}
      >
        {hasError && initializationError && (
          <ErrorMessage message="Initialization failed. Please try reloading the page." />
        )}
        {tokenError && (
          <ErrorMessage message="Token validation failed. You may need to log in again." />
        )}
        {!hasError && !tokenError && (
          <ErrorMessage message="An unexpected error occurred. Please contact support." />
        )}
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
