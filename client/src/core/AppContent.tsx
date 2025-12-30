import type { FC } from 'react';
import Box from '@mui/material/Box';
import useInitializeApp from '@hooks/useInitializeApp';
import AppRoutes from '@routes/AppRoutes';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import { ErrorType } from '@utils/error';
import { useThemeContext } from '@context/ThemeContext';

/**
 * AppContent
 *
 * Root application content wrapper responsible for:
 *
 * 1. Performing global, one-time application initialization
 *    (e.g. CSRF bootstrap, preflight checks).
 * 2. Handling **fatal initialization failures** that prevent
 *    the application from rendering at all.
 * 3. Rendering the application route tree once initialization
 *    is complete.
 *
 * IMPORTANT DESIGN NOTES:
 * ------------------------------------------------------------
 * - Authentication token refresh is NOT handled here.
 *   Token lifecycle is managed by:
 *     - Axios interceptors (reactive refresh on 401)
 *     - `useTokenRefresh` (proactive refresh in MainLayout)
 *
 * - This component must remain:
 *     - side effect minimal
 *     - free of auth/session logic
 *     - safe for first paint (LCP-sensitive)
 */
const AppContent: FC = () => {
  const { theme } = useThemeContext();
  
  const {
    isInitializing,
    hasError,
    initializationError,
  } = useInitializeApp({
    delayMs: 500, // Optional artificial delay for splash / loading UI
  });
  
  /* -------------------------------------------------------
   * Fatal initialization failure
   *
   * Example:
   * - Backend unavailable
   * - CSRF bootstrap failed irrecoverably
   *
   * We rely on structured AppError typing instead of
   * fragile string matching.
   * ----------------------------------------------------- */
  if (
    hasError &&
    initializationError?.type === ErrorType.Server
  ) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        }}
      >
        <ErrorDisplay
          message="The server is currently unavailable. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </Box>
    );
  }
  
  return (
    <Box
      className="app"
      sx={{
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* --------------------------------------------------
       * Initialization overlay (LCP-safe)
       *
       * - Uses static background color to avoid
       *   theme resolution cost during first paint.
       * - Blocks interaction while the app is bootstrapping.
       * -------------------------------------------------- */}
      {isInitializing && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.background.default,
            zIndex: 9999,
          }}
        >
          <Loading
            variant="linear"
            message="Initializing application..."
          />
        </Box>
      )}
      
      {/* --------------------------------------------------
       * Application routes
       * -------------------------------------------------- */}
      <AppRoutes />
    </Box>
  );
};

export default AppContent;
