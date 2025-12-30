import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import { useThemeContext } from '@context/ThemeContext';
import { ErrorType } from '@utils/error';

/**
 * Theme-aware UI wrapper for module-level errors.
 *
 * Responsibilities:
 * - Render a consistent, theme-aligned error UI
 * - Display optional recovery hints (e.g. from AppError.getRecoveryHint)
 * - Delegate retry behavior to the caller
 *
 * Notes:
 * - UI-only component
 * - Does NOT log, normalize, or classify errors
 * - Intended for use inside ErrorBoundaries
 */
interface Props {
  /** Primary user-facing error message */
  message?: string;
  
  /** Optional error classification (for display/debug only) */
  errorType?: ErrorType;
  
  /** Optional recovery hint (e.g. AppError.getRecoveryHint()) */
  recoveryHint?: string;
  
  /** Retry callback provided by the boundary or caller */
  onRetry: () => void;
}

const ThemeAwareErrorUI: FC<Props> = ({
                                        message,
                                        errorType,
                                        recoveryHint,
                                        onRetry,
                                      }) => {
  const { theme } = useThemeContext();
  
  return (
    <ErrorDisplay
      message={message || 'Module crashed. Try again later.'}
      onRetry={onRetry}
    >
      <Box
        aria-live="polite"
        sx={{
          mt: 2,
          p: 3,
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.error.main}`,
          textAlign: 'center',
        }}
      >
        <CustomTypography
          variant="h4"
          gutterBottom
          sx={{ color: theme.palette.error.main }}
        >
          Module Error
        </CustomTypography>
        
        <CustomTypography variant="body1" gutterBottom>
          {message ||
            'Something went wrong in this module. Please try again.'}
        </CustomTypography>
        
        {recoveryHint && (
          <CustomTypography
            variant="body2"
            sx={{
              mt: 1,
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
            }}
          >
            {recoveryHint}
          </CustomTypography>
        )}
        
        {errorType && (
          <CustomTypography
            variant="caption"
            sx={{ mt: 1, display: 'block' }}
          >
            Error Type: {errorType}
          </CustomTypography>
        )}
      </Box>
    </ErrorDisplay>
  );
};

export default ThemeAwareErrorUI;
