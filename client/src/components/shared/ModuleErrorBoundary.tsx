import { Component, ReactNode, ErrorInfo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface Props {
  children: ReactNode;            // The component's children
  fallback?: ReactNode;           // Custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // Optional error logging callback
}

interface State {
  hasError: boolean;
}

class ModuleErrorBoundary extends Component<Props, State> {
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
    console.error('Module error caught:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo); // Log errors via callback
    }
  }
  
  // Reset the error state to recover
  resetError = () => {
    this.setState({ hasError: false });
  };
  
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
            }}
            role="alert"
            aria-live="assertive"
          >
            <Typography variant="h4" gutterBottom>
              Module Error
            </Typography>
            <Typography variant="body1" gutterBottom>
              Something went wrong in this module. Please try again later.
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

export default ModuleErrorBoundary;
