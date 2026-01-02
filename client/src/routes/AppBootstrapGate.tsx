import type { FC, ReactNode } from 'react';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import useSession from '@hooks/useSession';
import useInitializeApp from '@hooks/useInitializeApp';
import { ErrorType } from '@utils/error';

/**
 * Props for AppBootstrapGate.
 *
 * Wraps the application and blocks rendering until
 * session state and core app initialization are complete.
 */
interface AppBootstrapGateProps {
  children: ReactNode;
}

/**
 * AppBootstrapGate
 *
 * Global, one-time application readiness gate.
 *
 * Responsibilities:
 * - Resolve session state
 * - Run global app initialization (CSRF, preflight)
 * - Block rendering until the app is fully ready
 *
 * MUST:
 * - Render exactly once per page load
 * - Be side effect free (besides hooks)
 */
const AppBootstrapGate: FC<AppBootstrapGateProps> = ({ children }) => {
  const { isLoading: sessionLoading } = useSession();
  
  const {
    isInitializing,
    hasError,
    initializationError,
  } = useInitializeApp();
  
  // Fatal initialization failure
  if (
    hasError &&
    initializationError?.type === ErrorType.Server
  ) {
    return (
      <ErrorDisplay
        message="The server is currently unavailable. Please try again later."
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Global bootstrap loading
  if (sessionLoading || isInitializing) {
    return (
      <Loading
        fullPage
        variant="linear"
        message="Preparing application…"
      />
    );
  }
  
  return <>{children}</>;
};

export default AppBootstrapGate;
