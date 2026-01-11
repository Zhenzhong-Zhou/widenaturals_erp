import type { FC, ReactNode } from 'react';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import { useInitializeApp } from '@core/bootstrap';
import { ErrorType } from '@utils/error';

/**
 * Props for AppBootstrapErrorBoundary.
 *
 * Wraps the application and provides a centralized
 * surface for fatal bootstrap errors.
 */
interface AppBootstrapErrorBoundaryProps {
  children: ReactNode;
}

/**
 * AppBootstrapErrorBoundary
 *
 * Lightweight bootstrap error boundary.
 *
 * Responsibilities:
 * - Trigger one-time, non-blocking application initialization
 * - Surface fatal bootstrap errors (e.g. server unavailable)
 *
 * MUST NOT:
 * - Block initial rendering
 * - Gate UI on authentication or permissions
 * - Show global loading indicators
 *
 * Notes:
 * - Initialization logic runs asynchronously after first paint
 * - Access control is handled by route-level guards
 * - This component does not enforce readiness or session state
 */
const AppBootstrapErrorBoundary: FC<AppBootstrapErrorBoundaryProps> = ({
                                                                         children,
                                                                       }) => {
  const { hasError, initializationError } = useInitializeApp();
  
  // Fatal initialization failure
  if (hasError && initializationError?.type === ErrorType.Server) {
    return (
      <ErrorDisplay
        message="The server is currently unavailable. Please try again later."
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  return <>{children}</>;
};

export default AppBootstrapErrorBoundary;
