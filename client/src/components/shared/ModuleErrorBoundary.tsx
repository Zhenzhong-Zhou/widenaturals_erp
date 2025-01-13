import { Component, ReactNode, ErrorInfo } from 'react';
import Box from '@mui/material/Box';
import { CustomButton, ErrorDisplay, Typography } from '@components/index.ts';
import AppError from '../../utils/AppError';

interface Props {
  children: ReactNode; // The component's children
  fallback?: ReactNode; // Custom fallback UI
  onError?: (error: AppError | Error, errorInfo: ErrorInfo) => void; // Optional error logging callback
}

interface State {
  hasError: boolean;
  errorMessage?: string; // Store error message for display
  errorType?: string; // Error type for more detailed messaging
}

class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: undefined, errorType: undefined };
  }
  
  // Update the error state when an error is caught
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error instanceof AppError ? error.message : 'An unexpected error occurred.',
      errorType: error instanceof AppError ? error.type : 'UnknownError',
    };
  }
  
  // Log the error or handle it as needed
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Module error caught:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo); // Log errors via callback
    } else if (error instanceof AppError) {
      AppError.reportError(error); // Log AppError to external service
    } else {
      console.error('Unhandled error:', error); // Default logging for non-AppError instances
    }
  }
  
  // Reset the error state to recover
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
