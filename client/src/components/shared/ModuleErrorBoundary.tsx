import { Component, type ReactNode, type ErrorInfo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import Box from '@mui/material/Box';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import CustomTypography from '@components/common/CustomTypography';
import { AppError, ErrorType } from '@utils/AppError';
import { handleError, mapErrorMessage } from '@utils/errorUtils';

// Props passed from hook wrapper
export interface ModuleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  navigate: NavigateFunction;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
  errorType?: ErrorType;
}

class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, State> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update the error state when an error is caught.
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: mapErrorMessage(error),
      errorType:
        error instanceof AppError ? error.type : ErrorType.UnknownError,
    };
  }

  /**
   * Log the error or handle it as needed.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Module error caught:', error, errorInfo);

    // Normalize the error into an AppError
    const appError =
      error instanceof AppError
        ? error
        : new AppError('An unknown error occurred.', 500, {
          type: ErrorType.UnknownError,
          details: {
            originalError: error.message || 'Unknown error',
            componentStack: errorInfo.componentStack || '',
          },
        });
    
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    } else {
      handleError(appError, (loggedError) =>
        console.error('Error logged:', loggedError)
      );
    }
  }

  /**
   * Reset the error state to recover.
   */
  resetError = () => {
    this.setState({
      hasError: false,
      errorMessage: undefined,
      errorType: undefined,
    });
  };
  
  render() {
    const { hasError, errorMessage, errorType } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      return (
        fallback || (
          <ErrorDisplay
            message={errorMessage || 'Module crashed. Try again later.'}
            onRetry={this.resetError}
          >
            <Box
              aria-live="polite"
              sx={{
                mt: 2,
                p: 3,
                borderRadius: 1,
                backgroundColor: '#fff',
                color: '#444',
                textAlign: 'center',
              }}
            >
              <CustomTypography variant="h4" color="error" gutterBottom>
                Module Error
              </CustomTypography>
              
              <CustomTypography variant="body1" gutterBottom>
                {errorMessage ||
                  'Something went wrong in this module. Please try again.'}
              </CustomTypography>
              
              {errorType && (
                <CustomTypography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  Error Type: {errorType}
                </CustomTypography>
              )}
            </Box>
          </ErrorDisplay>
        )
      );
    }
    
    return children;
  }
}

export default ModuleErrorBoundary;
