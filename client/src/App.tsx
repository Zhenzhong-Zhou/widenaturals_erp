import type { ErrorInfo, FC } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProviderWrapper, LoadingProvider } from '@context/index';
import { FallbackUI, GlobalErrorBoundaryWithReset } from '@components/index';
import { AppBootstrapErrorBoundary, AppContent, AppShell } from '@core/index';
import { AppBootstrapGate } from '@core/bootstrap';

/**
 * App
 *
 * Root application composition component.
 *
 * Responsibilities:
 * - Compose global infrastructure providers (theme, loading, routing)
 * - Establish application-wide error boundaries
 * - Define the top-level bootstrap and rendering order
 *
 * Explicitly NOT responsible for:
 * - Performing authentication or session bootstrap logic
 * - Reading authentication, permission, or feature state
 * - Rendering feature-level UI directly
 *
 * Architectural notes:
 * - Session bootstrap is delegated to `AppBootstrapGate`, which must
 *   wrap routing and all route guards
 * - Error boundaries are layered to isolate bootstrap-time failures
 *   from runtime UI errors
 * - Provider order is intentional to ensure routing, theming, and
 *   loading context remain available during error states
 */
const App: FC = () => {
  /**
   * Stable fallback UI for unrecoverable application-level errors.
   *
   * Extracted to a constant to:
   * - Avoid unnecessary JSX recreation
   * - Ensure consistent error presentation
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
   * Global error handler invoked by the top-level error boundary.
   *
   * Environment behavior:
   * - Development: logs full error details to the console
   * - Production: intended for integration with monitoring services
   *   (e.g. Sentry, Datadog, LogRocket)
   */
  const handleGlobalError = (error: Error, errorInfo: ErrorInfo) => {
    if (import.meta.env.PROD) {
      // TODO: forward error to monitoring / observability service
      // reportError(error, errorInfo);
    } else {
      console.error('Global Error:', error, errorInfo);
    }
  };

  return (
    // Bootstrap gate MUST wrap routing to prevent premature redirects
    <AppBootstrapGate>
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
    </AppBootstrapGate>
  );
};

export default App;
