import { FC, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import { useInitializeApp } from '../hooks';
import AppRoutes from '../routes/AppRoutes.tsx';
import { Loading, ErrorDisplay } from '@components/index.ts';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { selectAccessToken } from '../features/session/state/sessionSelectors.ts';
import { isTokenValid } from '@utils/tokenValidationUtils.ts';
import { logoutThunk } from '../features/session/state/sessionThunks.ts';
import { refreshTokenThunk } from '../features/session';

/**
 * AppContent Component
 * Manages global initialization and renders routes based on authentication status.
 */
const AppContent: FC = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  
  // Initialize the app with global loading
  const { isInitializing, hasError, initializationError } = useInitializeApp({
    delay: 500,
    retryAttempts: 3,
  });
  
  // Validate and refresh token on initial load
  const validateAndRefreshToken = useCallback(async () => {
    if (accessToken) {
      if (!isTokenValid(accessToken)) {
        console.warn('Access token is invalid. Attempting to refresh...');
        try {
          await dispatch(refreshTokenThunk()).unwrap(); // Try refreshing the token
          console.log('Access token refreshed successfully.');
        } catch (error) {
          console.error('Failed to refresh token:', error);
          await dispatch(logoutThunk()).unwrap(); // Clear session if refresh fails
        }
      } else {
        console.log('Access token is valid.');
      }
    }
  }, [accessToken, dispatch]);
  
  // Run validation on initial load or when accessToken changes
  useEffect(() => {
    validateAndRefreshToken().catch((err) =>
      console.error('Error during token validation and refresh:', err)
    );
  }, [validateAndRefreshToken]);
  
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
