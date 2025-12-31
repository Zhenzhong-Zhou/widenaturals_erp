import type { FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useThemeContext } from '@context/ThemeContext';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';

interface ErrorDisplayProps {
  /** Primary user-facing error message */
  message?: string;
  
  /** Optional recovery hint (non-fatal guidance) */
  hint?: string;
  
  /** Optional retry handler */
  onRetry?: () => void;
  
  /** Optional diagnostic or contextual content */
  children?: ReactNode;
}

/**
 * ErrorDisplay
 *
 * Pure UI component for displaying recoverable or terminal errors.
 *
 * Responsibilities:
 * - Display user-facing error messages
 * - Offer retry / navigation actions
 *
 * MUST NOT:
 * - Throw errors
 * - Perform side effects
 * - Inspect application state
 */
const ErrorDisplay: FC<ErrorDisplayProps> = ({
                                               message,
                                               hint,
                                               onRetry,
                                               children,
                                             }) => {
  const { theme } = useThemeContext();
  const navigate = useNavigate();
  
  return (
    <Box
      role="alert"
      aria-live="assertive"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 4,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      {/* Primary error message */}
      <CustomTypography
        variant="h4"
        gutterBottom
        sx={{
          color: theme.palette.error.main,
          fontWeight: 700,
          minHeight: 48,
        }}
      >
        {message ?? 'An unexpected error occurred.'}
      </CustomTypography>
      
      {/* Optional recovery hint */}
      {hint && (
        <CustomTypography
          variant="body1"
          sx={{
            mt: 1,
            maxWidth: 640,
            color: theme.palette.text.secondary,
          }}
        >
          {hint}
        </CustomTypography>
      )}
      
      {/* Optional contextual content */}
      {children && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.secondary,
            maxWidth: 720,
            width: '100%',
            textAlign: 'left',
          }}
        >
          {children}
        </Box>
      )}
      
      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        {onRetry && (
          <CustomButton
            variant="contained"
            color="primary"
            onClick={onRetry}
          >
            Retry
          </CustomButton>
        )}
        
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
