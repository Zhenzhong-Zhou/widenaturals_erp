import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import { AppError, ErrorType } from '@utils/AppError';
import { handleError, mapErrorMessage } from '@utils/errorUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined };
  }
  
  /**
   * Update state when an error is thrown.
   */
  static getDerivedStateFromError(error: Error): State {
    const userMessage = mapErrorMessage(error);
    return { hasError: true, errorMessage: userMessage };
  }
  
  /**
   * Custom error handling or logging.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    const appError = new AppError('A global application error occurred.', 500, {
      type: ErrorType.GlobalError,
      details: {
        originalError: error.message || 'Unknown error',
        componentStack: errorInfo.componentStack || '',
      },
    });
    
    // Log the error using errorUtils or a custom handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    } else {
      handleError(appError);
      this.logErrorToServer(appError);
    }
  }
  
  /**
   * Log to external service/server.
   */
  logErrorToServer = (error: AppError) => {
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          status: error.status,
          type: error.type,
          details: error.details,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.error('Error logging to server:', err);
      });
    } catch (err) {
      console.error('Failed to send error:', err);
    }
  };
  
  /**
   * Reset boundary to allow retry rendering.
   */
  resetError = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };
  
  render() {
    const { hasError, errorMessage } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      return (
        fallback || (
          <ErrorDisplay
            message={errorMessage || 'Something went wrong.'}
            onRetry={this.resetError}
          />
        )
      );
    }
    
    return children;
  }
}

export default GlobalErrorBoundary;
