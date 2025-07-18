import type { FC } from 'react';
import Box from '@mui/material/Box';
import useInitializeApp from '@hooks/useInitializeApp';
import { useValidateAndRefreshToken } from '@hooks/useValidateAndRefreshToken';
import AppRoutes from '@routes/AppRoutes';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';

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
  const { loading: isTokenRefreshing } = useValidateAndRefreshToken();

  // Show critical error for initialization failure
  if (
    hasError &&
    initializationError?.message.includes('Server is currently unavailable')
  ) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fefefe', // Static fallback bg
          color: '#111',
        }}
      >
        <ErrorDisplay
          message="The server is currently unavailable. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </Box>
    );
  }

  // Render the app while token refreshing happens in the background
  return (
    <Box className="app" sx={{ minHeight: '100vh', position: 'relative' }}>
      {/* LCP-optimized init overlay */}
      {isInitializing && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff', // Avoid dynamic theme eval
            zIndex: 9999,
          }}
        >
          <Loading variant="linear" message="Initializing application..." />
        </Box>
      )}

      {/* INP-friendly background token refresh */}
      {isTokenRefreshing && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            backgroundColor: '#fff',
            color: '#333',
            padding: '8px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            fontSize: '0.875rem',
            zIndex: 1000,
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
