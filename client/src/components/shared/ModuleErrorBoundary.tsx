import { Component, type ReactNode, type ErrorInfo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { AppError, handleError, mapErrorMessage } from '@utils/error';
import ThemeAwareErrorUI from '@components/shared/ThemeAwareErrorUI';

export interface ModuleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  navigate: NavigateFunction;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, State> {
  state: State = { hasError: false };

  /* =========================================================
   * Lifecycle
   * ======================================================= */

  static getDerivedStateFromError(error: unknown): State {
    const appError =
      error instanceof AppError
        ? error
        : AppError.unknown('Unexpected module error', error);

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    const appError =
      error instanceof AppError
        ? error
        : AppError.unknown('Unhandled module exception', {
            error,
            componentStack: errorInfo.componentStack,
          });

    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    } else {
      handleError(appError);
    }
  }

  /* =========================================================
   * Recovery
   * ======================================================= */

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  /* =========================================================
   * Render
   * ======================================================= */

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    const message = mapErrorMessage(error);
    const recoveryHint = error?.getRecoveryHint();

    return (
      fallback || (
        <ThemeAwareErrorUI
          message={message}
          recoveryHint={recoveryHint}
          errorType={error?.type}
          onRetry={this.resetError}
        />
      )
    );
  }
}

export default ModuleErrorBoundary;
