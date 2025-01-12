import { FC, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useThemeContext } from '../../context/ThemeContext.tsx';

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
  const { theme } = useThemeContext();
  
  return (
    <Box
      sx={{
        textAlign: 'center',
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderRadius: theme.spacing(1),
        boxShadow: theme.shadows[2],
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
          sx={{ color: theme.palette.text.secondary, marginBottom: theme.spacing(2) }}
        >
          Error Code: <strong>{errorCode}</strong>
        </Typography>
      )}
      
      {errorLog && (
        <Box>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            sx={{ marginBottom: theme.spacing(2) }}
            size="small"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          {showDetails && (
            <Box
              component="pre"
              sx={{
                textAlign: 'left',
                padding: theme.spacing(2),
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.secondary,
                borderRadius: theme.spacing(1),
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: theme.typography.body2.fontSize,
                marginTop: theme.spacing(2),
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
          sx={{ marginTop: theme.spacing(2) }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
};

export default FallbackUI;
