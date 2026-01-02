import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import { AppError, handleError, mapErrorMessage } from '@utils/error';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Optional callback for external error handling
   * (e.g. analytics, Sentry boundary hook)
   */
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

/* =========================================================
 * Global React Error Boundary
 * ======================================================= */

/**
 * Catches unrecoverable rendering errors in the React tree and
 * converts them into a normalized AppError instance.
 *
 * DESIGN:
 * - Last-resort UI boundary
 * - Never throws
 * - Never mutates application state beyond itself
 *
 * RESPONSIBILITIES:
 * - Normalize unknown errors into AppError
 * - Delegate logging/reporting to `handleError`
 * - Render a safe fallback UI
 */
class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
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
      fallback ?? <ErrorDisplay message={message} onRetry={this.resetError} />
    );
  }
}

export default GlobalErrorBoundary;
