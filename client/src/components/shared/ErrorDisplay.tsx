import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus';
import { selectCsrfStatus, selectCsrfError } from '@features/csrf/state';
import { useAppSelector } from '@store/storeHooks';
import GoBackButton from '@components/common/GoBackButton.tsx';
import { useNavigate } from 'react-router-dom';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ message, onRetry, children }) => {
  const csrfStatus = useAppSelector(selectCsrfStatus);
  const csrfError = useAppSelector(selectCsrfError);
  
  const navigate = useNavigate();

  // Monitor CSRF status and handle potential issues
  const csrfErrorMessage = (() => {
    try {
      monitorCsrfStatus(csrfStatus, csrfError);
      return null;
    } catch {
      return 'An error occurred during CSRF token initialization.';
    }
  })();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 4,
        backgroundColor: '#fdfdfd',
        color: '#222',
      }}
    >
      <CustomTypography
        variant="h4"
        gutterBottom
        sx={{
          color: '#d32f2f',
          fontWeight: 700,
          textRendering: 'optimizeLegibility',
          minHeight: '48px',
        }}
      >
        {message || csrfErrorMessage || 'An unexpected error occurred.'}
      </CustomTypography>
      
      {children && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: '#fff',
            color: '#666',
            textAlign: 'left',
            maxWidth: 600,
            width: '100%',
            fontSize: '0.95rem',
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
          sx={{ mt: 3 }}
        >
          Retry
        </CustomButton>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <GoBackButton />
        
        <CustomButton
          variant="outlined"
          color="secondary"
          onClick={() => navigate('/')}
        >
          Go to Home
        </CustomButton>
      </Box>
    </Box>
  );
};

export default ErrorDisplay;
