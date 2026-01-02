import { type FC, useState } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import { useThemeContext } from '@context/ThemeContext';

interface FallbackUIProps {
  title?: string;
  description?: string;
  errorCode?: string;
  errorLog?: string;
  onRetry?: () => void;
}

const FallbackUI: FC<FallbackUIProps> = ({
  title = 'Oops! Something went wrong.',
  description = 'Please try again later or contact support.',
  errorCode,
  errorLog,
  onRetry,
}) => {
  const { theme } = useThemeContext();
  const [showDetails, setShowDetails] = useState(false);

  const handleGoHome = () => {
    window.location.replace('/');
  };

  const retryHandler = onRetry ?? (() => window.location.reload());

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: 'auto',
        p: 4,
        borderRadius: 2,
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[3],
        border: errorCode
          ? `1px solid ${theme.palette.error.main}`
          : `1px solid ${theme.palette.divider}`,
      }}
    >
      <CustomTypography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: theme.palette.error.main,
        }}
        gutterBottom
      >
        {title}
      </CustomTypography>

      <CustomTypography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          mb: 2,
        }}
      >
        {description}
      </CustomTypography>

      {errorCode && (
        <ErrorMessage
          message={`Error Code: ${errorCode}`}
          severity="info"
          sx={{ mb: 2 }}
        />
      )}

      {errorLog && (
        <Box>
          <CustomButton
            variant="text"
            size="small"
            onClick={() => setShowDetails((prev) => !prev)}
            sx={{ mb: 1 }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </CustomButton>

          {showDetails && (
            <Box
              component="pre"
              sx={{
                textAlign: 'left',
                backgroundColor: theme.palette.stack,
                color: theme.palette.text.secondary,
                p: 2,
                borderRadius: 1,
                maxHeight: 200,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {errorLog}
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {/* Retry Button */}
        {onRetry && (
          <CustomButton
            variant="contained"
            onClick={retryHandler}
            sx={{ minWidth: 120, fontWeight: 600 }}
          >
            Retry
          </CustomButton>
        )}

        {/* Keep only if GoBackButton does NOT use router hooks */}
        <GoBackButton
          sx={{
            minWidth: 120,
            px: 3,
            fontWeight: 600,
            borderRadius: 200,
            mt: 0, // override default spacing
          }}
        />

        <CustomButton
          variant="outlined"
          color="secondary"
          onClick={handleGoHome}
          sx={{ minWidth: 120, fontWeight: 600 }}
        >
          Go Home
        </CustomButton>
      </Box>
    </Box>
  );
};

export default FallbackUI;
