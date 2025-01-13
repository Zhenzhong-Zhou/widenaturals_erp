import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Typography, CustomButton } from '@components/index';

interface ErrorDisplayProps {
  message: string; // Error message to display
  onRetry?: () => void; // Optional retry handler
  children?: ReactNode; // Optional custom children
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ message, onRetry, children }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: 4,
    }}
  >
    <Typography variant="h4" color="error" gutterBottom>
      {message}
    </Typography>
    {children}
    {onRetry && (
      <CustomButton variant="contained" color="primary" onClick={onRetry} sx={{ marginTop: 2 }}>
        Retry
      </CustomButton>
    )}
  </Box>
);

export default ErrorDisplay;
