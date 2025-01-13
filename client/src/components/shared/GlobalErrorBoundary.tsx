import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from '@components/index.ts'; // Replace with actual import path
import AppError from '@utils/AppError.tsx'; // Replace with actual import path
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts'; // Import global error utilities

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Optional error logging function
}

interface State {
  hasError: boolean;
  errorMessage?: string; // Store error message for display
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined };
  }
  
  /**
   * Update the error state when an error is caught.
   */
  static getDerivedStateFromError(error: Error): State {
    const errorMessage = mapErrorMessage(error); // Use mapErrorMessage for user-friendly messages
    return { hasError: true, errorMessage };
  }
  
  /**
   * Log the error or handle it as needed.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    const appError = new AppError(
      error.message || 'An unknown error occurred.',
      500,
      'GlobalError',
      errorInfo.componentStack || 'No stack trace available.'
    );
    
    // Log the error using errorUtils or a custom handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    } else {
      handleError(appError); // Log the error using handleError
      this.logErrorToServer(appError); // Log error to the server
    }
  }
  
  /**
   * Reset error state to allow retry without reloading.
   */
  resetError = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };
  
  /**
   * Log the error to the server or external service.
   */
  logErrorToServer(error: AppError) {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Unknown error',
        stack: error.stack || 'No stack trace available',
        type: error.type,
        timestamp: new Date().toISOString(),
      }),
    }).catch((serverError) => {
      console.error('Failed to log error to server:', serverError);
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorDisplay
            message={this.state.errorMessage || 'Something went wrong. Please try again.'}
            onRetry={this.resetError}
          />
        )
      );
    }
    
    return this.props.children;
  }
}

export default GlobalErrorBoundary;
