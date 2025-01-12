import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface FallbackUIProps {
  title?: string;        // Error title
  description?: string;  // User-friendly description
  errorCode?: string;    // Optional error code for debugging
  errorLog?: string;     // Optional detailed error log
  onRetry?: () => void;  // Retry action callback
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
        backgroundColor: 'background.default',
        color: 'text.primary',
        borderRadius: 1,
        boxShadow: 2,
      }}
      role="alert"
      aria-live="assertive"
    >
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {description}
      </Typography>
      
      {errorCode && (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', marginBottom: 2 }}
        >
          Error Code: <strong>{errorCode}</strong>
        </Typography>
      )}
      
      {errorLog && (
        <Box>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            sx={{ marginBottom: 2 }}
            size="small"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
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
                fontSize: '0.9rem',
                marginTop: 2,
              }}
            >
              {errorLog}
            </Box>
          )}
        </Box>
      )}
      
      {onRetry && (
        <Button
          variant="contained"
          color="primary"
          onClick={onRetry}
          sx={{ marginTop: 2 }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
};

export default FallbackUI;
