import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useThemeContext } from '../../context/ThemeContext.tsx';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void; // Retry action for recoverable errors
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  const { theme } = useThemeContext();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        backgroundColor: theme.palette.background.default, // Use theme background
        color: theme.palette.text.primary, // Use theme text color
        padding: theme.spacing(4), // Consistent padding with theme
      }}
    >
      <Typography
        variant="h4"
        color={theme.palette.error.main} // Use theme error color
        gutterBottom
      >
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          color="primary"
          onClick={onRetry}
          sx={{
            marginTop: theme.spacing(2), // Add spacing between elements
          }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
};

export default ErrorDisplay;
