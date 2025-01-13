import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorDisplay } from '@components/index.ts';
import AppError from '../utils/AppError';

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
  
  // Update the error state when an error is caught
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'An unexpected error occurred.' };
  }
  
  // Log the error or handle it as needed
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    const appError = new AppError(
      error.message,
      500,
      'GlobalError',
      errorInfo.componentStack
    );
    
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    } else {
      this.logErrorToServer(appError);
    }
  }
  
  // Reset error state to allow retry without reloading
  resetError = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };
  
  // Log the error to the server or external service
  logErrorToServer(error: AppError) {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
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
