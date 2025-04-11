import { type FC, useState } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';

interface FallbackUIProps {
  title?: string; // Error title
  description?: string; // User-friendly description
  errorCode?: string; // Optional error code for debugging
  errorLog: string | undefined; // Optional detailed error log
  onRetry?: () => void; // Retry action callback
}

const FallbackUI: FC<FallbackUIProps> = ({
  title = 'Oops! Something went wrong.',
  description = 'Please try again later or contact support.',
  errorCode,
  errorLog,
  onRetry,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Box
      sx={{
        textAlign: 'center',
        padding: 4,
        borderRadius: 1,
        boxShadow: 2,
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      {/* Error Title */}
      <CustomTypography variant="h4" color="error" gutterBottom>
        {title}
      </CustomTypography>

      {/* Error Description */}
      <CustomTypography variant="body1" gutterBottom>
        {description}
      </CustomTypography>

      {/* Error Code */}
      {errorCode && (
        <ErrorMessage
          message={`Error Code: ${errorCode}`}
          severity="info"
          sx={{ marginBottom: 2 }}
        />
      )}

      {/* Error Details */}
      {errorLog && (
        <Box>
          <CustomButton
            variant="text"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            sx={{ marginBottom: 2 }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </CustomButton>
          {showDetails && (
            <Box
              component="pre"
              sx={{
                textAlign: 'left',
                padding: 2,
                backgroundColor: 'background.paper',
                color: 'text.secondary',
                borderRadius: 1,
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: 'body2.fontSize',
              }}
            >
              {errorLog}
            </Box>
          )}
        </Box>
      )}

      {/* Retry Button */}
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

export default FallbackUI;
