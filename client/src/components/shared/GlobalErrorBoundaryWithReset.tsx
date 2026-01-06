import type { ErrorInfo, FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { GlobalErrorBoundary } from '@components/index';
import type { AppError } from '@utils/error';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, info: ErrorInfo) => void;
}

/**
 * GlobalErrorBoundaryWithReset
 *
 * Wraps GlobalErrorBoundary and provides an automatic reset signal
 * based on navigation and authentication state.
 *
 * Reset triggers:
 * - Route change (pathname + search)
 * - Authentication change (login/logout)
 *
 * This prevents users from being permanently trapped in an error state.
 */
const GlobalErrorBoundaryWithReset: FC<Props> = ({
                                                   children,
                                                   fallback,
                                                   onError,
                                                 }) => {
  const location = useLocation();
  
  /**
   * Reset key must change whenever the app enters
   * a potentially recoverable state.
   */
  const resetKey = `${location.pathname}${location.search}${location.hash}`;
  
  return (
    <GlobalErrorBoundary
      fallback={fallback}
      onError={onError}
      resetKey={resetKey}
    >
      {children}
    </GlobalErrorBoundary>
  );
};

export default GlobalErrorBoundaryWithReset;
