import { Component, ErrorInfo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Optional error logging function
}

interface State {
  hasError: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  // Update the error state when an error is caught
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  
  // Log the error or handle it as needed
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
    
    // Check if onError is provided, otherwise default to console logging
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      this.logErrorToServer(error, errorInfo);
    }
  }
  
  // Reset error state to allow retry without reloading
  resetError = () => {
    this.setState({ hasError: false });
  };
  
  // Placeholder for Node.js server logging
  logErrorToServer(error: Error, errorInfo: ErrorInfo) {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
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
          <Box
            sx={{
              textAlign: 'center',
              padding: 4,
              backgroundColor: 'background.default',
              color: 'text.primary',
              borderRadius: 1,
              boxShadow: 1,
              margin: 2,
            }}
            role="alert"
            aria-live="assertive"
          >
            <Typography variant="h4" gutterBottom>
              Critical Error
            </Typography>
            <Typography variant="body1" gutterBottom>
              Something went wrong. Please reload the app or contact support.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={this.resetError}
              sx={{ marginTop: 2 }}
            >
              Retry
            </Button>
          </Box>
        )
      );
    }
    
    return this.props.children;
  }
}

export default GlobalErrorBoundary;
