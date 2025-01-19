import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Typography, CustomButton } from '@components/index';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus.ts';
import { selectCsrfStatus, selectCsrfError } from '../../features/csrf/state/csrfSelector';
import { useAppSelector } from '../../store/storeHooks';

interface ErrorDisplayProps {
  message?: string; // Custom error message to display
  onRetry?: () => void; // Optional retry handler
  children?: ReactNode; // Optional custom children
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ message, onRetry, children }) => {
  // Select CSRF status and error from Redux store
  const csrfStatus = useAppSelector(selectCsrfStatus);
  const csrfError = useAppSelector(selectCsrfError);
  
  // Monitor CSRF status and handle any errors
  try {
    monitorCsrfStatus(csrfStatus, csrfError);
  } catch (error) {
    message = message || 'An error occurred during CSRF token initialization.';
  }
  
  return (
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
        {message || 'An unexpected error occurred.'}
      </Typography>
      {children}
      {onRetry && (
        <CustomButton variant="contained" color="primary" onClick={onRetry} sx={{ marginTop: 2 }}>
          Retry
        </CustomButton>
      )}
    </Box>
  );
};

export default ErrorDisplay;
