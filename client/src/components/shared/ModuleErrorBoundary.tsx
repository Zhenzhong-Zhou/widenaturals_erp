import { Component, ReactNode, ErrorInfo } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, ErrorDisplay, Typography } from '@components/index.ts';
import { AppError, ErrorType } from '@utils/AppError.tsx';
import { handleError, mapErrorMessage } from '@utils/errorUtils.ts'; // Import error utilities

interface Props {
  children: ReactNode; // The component's children
  fallback?: ReactNode; // Custom fallback UI
  onError?: (error: AppError, errorInfo: ErrorInfo) => void; // Optional error logging callback
}

interface State {
  hasError: boolean;
  errorMessage?: string; // Store error message for display
  errorType?: ErrorType; // Error type for more detailed messaging
}

class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined, errorType: undefined };
  }
  
  /**
   * Update the error state when an error is caught.
   */
  static getDerivedStateFromError(error: Error): State {
    const errorMessage = mapErrorMessage(error); // Map user-friendly error message
    const errorType = error instanceof AppError ? error.type : ErrorType.UnknownError; // Use ErrorType enum for consistency
    
    return {
      hasError: true,
      errorMessage,
      errorType,
    };
  }
  
  /**
   * Log the error or handle it as needed.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Module error caught:', error, errorInfo);
    
    // Normalize the error into an AppError
    const appError = error instanceof AppError
      ? error
      : new AppError('An unknown error occurred.', 500, {
        type: ErrorType.UnknownError,
        details: {
          originalError: error.message || 'Unknown error',
          componentStack: errorInfo.componentStack || 'No stack trace available',
        },
      });
    
    if (this.props.onError) {
      this.props.onError(appError, errorInfo); // Pass error to parent-defined handler
    } else {
      handleError(appError, (loggedError) => {
        console.error('Error logged:', loggedError);
      }); // Log the normalized error
    }
  }
  
  /**
   * Reset the error state to recover.
   */
  resetError = () => {
    this.setState({ hasError: false, errorMessage: undefined, errorType: undefined });
  };
  
  render() {
    const { hasError, errorMessage, errorType } = this.state;
    const { fallback } = this.props;
    
    if (hasError) {
      return (
        fallback || (
          <ErrorDisplay
            message={errorMessage || 'Something went wrong in this module. Please try again later.'}
            onRetry={this.resetError}
          >
            <Box
              sx={{
                textAlign: 'center',
                padding: 4,
                backgroundColor: 'background.default',
                color: 'text.primary',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="h4" color="error" gutterBottom>
                Module Error
              </Typography>
              <Typography variant="body1" gutterBottom>
                {errorMessage || 'Something went wrong in this module. Please try again later.'}
              </Typography>
              {errorType && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Error Type: {errorType}
                </Typography>
              )}
              <CustomButton
                variant="contained"
                color="primary"
                onClick={this.resetError}
                sx={{ marginTop: 2 }}
              >
                Retry
              </CustomButton>
            </Box>
          </ErrorDisplay>
        )
      );
    }
    
    return this.props.children;
  }
}

export default ModuleErrorBoundary;
