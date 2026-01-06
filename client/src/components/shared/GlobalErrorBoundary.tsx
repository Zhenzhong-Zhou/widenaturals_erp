import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import { AppError, handleError, mapErrorMessage } from '@utils/error';
import { hardLogout } from '@features/session/utils/hardLogout';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Optional callback for external error handling
   * (e.g. analytics, Sentry boundary hook)
   */
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  
  /** Changing this value resets the boundary */
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

/* =========================================================
 * Global React Error Boundary
 * ======================================================= */

/**
 * GlobalErrorBoundary
 *
 * Catches unrecoverable rendering errors in the React component tree
 * and converts them into a normalized `AppError` instance.
 *
 * This boundary represents the final safety net for the application.
 * It is intended to prevent fatal render-time errors from permanently
 * breaking the UI or trapping users in an unrecoverable state.
 *
 * DESIGN PRINCIPLES:
 * - Last-resort boundary (should rarely activate)
 * - Never throws
 * - Does not depend on routing, Redux state, or hooks
 * - Self-contained error lifecycle with explicit reset semantics
 *
 * RESPONSIBILITIES:
 * - Capture render-time errors via React error boundary lifecycle
 * - Normalize unknown errors into `AppError`
 * - Delegate logging and reporting to `handleError` or an external handler
 * - Render a safe fallback UI for recovery
 *
 * RECOVERY MECHANISMS:
 * - Automatic reset when `resetKey` changes (e.g. route navigation)
 * - Manual retry via fallback UI
 * - Optional hard reset via session invalidation and full reload
 *
 * WHAT THIS BOUNDARY MUST NOT DO:
 * - Persist error state
 * - Perform navigation directly
 * - Inspect or mutate application business state
 * - Contain feature- or module-specific recovery logic
 *
 * USAGE NOTES:
 * - Intended to wrap the entire application shell
 * - Should be paired with a wrapper that provides `resetKey`
 *   (e.g. route-based reset via `useLocation`)
 */
class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  
  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.resetError();
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError =
      error instanceof AppError
        ? error
        : AppError.unknown('A global application error occurred', {
            originalMessage: error.message,
            componentStack: errorInfo.componentStack,
          });

    this.setState({ error: appError });

    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    } else {
      handleError(appError);
    }
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (!hasError) {
      return children;
    }

    const message = mapErrorMessage(error);

    return (
      fallback ??
      <ErrorDisplay
        message={message}
        onRetry={this.resetError}
        onHardReset={() => {
          void hardLogout(); // clears session + reloads
        }}
      />
    );
  }
}

export default GlobalErrorBoundary;
