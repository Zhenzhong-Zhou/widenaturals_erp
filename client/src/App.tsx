import type { ErrorInfo, FC } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProviderWrapper, LoadingProvider } from '@context/index';
import {
  FallbackUI,
  GlobalErrorBoundaryWithReset
} from '@components/index';
import {
  AppBootstrapErrorBoundary,
  AppContent,
  AppShell
} from '@core/index';

/**
 * App
 *
 * Root application component.
 *
 * Responsibilities:
 * - Compose global infrastructure providers (theme, loading)
 * - Initialize client-side routing
 * - Establish global error and bootstrap error boundaries
 *
 * MUST NOT:
 * - Perform blocking application bootstrap logic
 * - Read authentication or permission state
 * - Render feature-level UI
 *
 * Notes:
 * - Bootstrap execution is delegated to a non-blocking boundary component
 * - Providers are ordered intentionally to ensure theming and routing
 *   remain available during error states
 * - Error logging is environment-aware to avoid noisy production output
 */
const App: FC = () => {
  /**
   * Stable fallback UI for unrecoverable application errors.
   * Extracted to avoid unnecessary JSX recreation.
   */
  const errorFallback = (
    <FallbackUI
      title="Critical Error"
      description="An unexpected error occurred. Please refresh the page or contact support."
      errorCode="APP-5001"
      errorLog="Critical application failure during initialization."
    />
  );

  /**
   * Global error handler.
   *
   * In development:
   * - Logs full error details to the console
   *
   * In production:
   * - Intended for integration with monitoring services
   *   (e.g., Sentry, Datadog, LogRocket)
   */
  const handleGlobalError = (error: Error, errorInfo: ErrorInfo) => {
    if (import.meta.env.PROD) {
      // TODO: Integrate with monitoring service
      // reportError(error, errorInfo);
    } else {
      console.error('Global Error:', error, errorInfo);
    }
  };

  return (
    <BrowserRouter>
      <ThemeProviderWrapper>
        <LoadingProvider>
          <GlobalErrorBoundaryWithReset
            fallback={errorFallback}
            onError={handleGlobalError}
          >
            <AppShell>
              <AppBootstrapErrorBoundary>
                <AppContent />
              </AppBootstrapErrorBoundary>
            </AppShell>
          </GlobalErrorBoundaryWithReset>
        </LoadingProvider>
      </ThemeProviderWrapper>
    </BrowserRouter>
  );
};

export default App;
