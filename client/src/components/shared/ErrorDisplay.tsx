import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus';
import {
  selectCsrfStatus,
  selectCsrfError,
} from '@features/csrf/state';
import { useAppSelector } from '@store/storeHooks';

interface ErrorDisplayProps {
  message?: string; // Custom error message to display
  onRetry?: () => void; // Optional retry handler
  children?: ReactNode; // Optional custom children for additional error details
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  children,
}) => {
  // Select CSRF status and error from Redux store
  const csrfStatus = useAppSelector(selectCsrfStatus);
  const csrfError = useAppSelector(selectCsrfError);

  // Monitor CSRF status and handle potential issues
  const csrfErrorMessage = (() => {
    try {
      monitorCsrfStatus(csrfStatus, csrfError);
      return null;
    } catch (error) {
      return 'An error occurred during CSRF token initialization.';
    }
  })();

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
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      <CustomTypography variant="h4" color="error" gutterBottom>
        {message || csrfErrorMessage || 'An unexpected error occurred.'}
      </CustomTypography>
      {children && (
        <Box
          sx={{
            marginTop: 2,
            padding: 2,
            borderRadius: 1,
            backgroundColor: 'background.paper',
            color: 'text.secondary',
            textAlign: 'left',
          }}
        >
          {children}
        </Box>
      )}
      {onRetry && (
        <CustomButton
          variant="contained"
          color="primary"
          onClick={onRetry}
          sx={{ marginTop: 2 }}
        >
          Retry
        </CustomButton>
      )}
    </Box>
  );
};

export default ErrorDisplay;
