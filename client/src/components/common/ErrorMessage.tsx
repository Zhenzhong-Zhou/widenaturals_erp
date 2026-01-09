import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import Box, { type BoxProps } from '@mui/material/Box';
import CustomButton from '@components/common/CustomButton';

interface ErrorMessageProps extends BoxProps {
  message: string | null;
  severity?: 'error' | 'warning' | 'info';
  showNavigation?: boolean; // Optional Go Back / Home buttons
  onGoBack?: () => void; // Custom go back logic
  onHome?: () => void; // Custom home redirect
}

const ErrorMessage: FC<ErrorMessageProps> = ({
  message,
  severity = 'error',
  showNavigation = false,
  onGoBack,
  onHome,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const colorMap = {
    error: theme?.palette?.error?.main || '#d32f2f',
    warning: theme?.palette?.warning?.main || '#ff9800',
    info: theme?.palette?.info?.main || '#0288d1',
  };

  return (
    <Box
      sx={{
        color: colorMap[severity],
        fontSize: '0.875rem',
        fontWeight: 500,
        marginTop: '8px',
        marginBottom: '8px',
        whiteSpace: 'pre-wrap',
        textAlign: 'center',
        ...sx,
      }}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {message}

      {showNavigation && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <CustomButton
            variant="outlined"
            color="primary"
            onClick={onGoBack || (() => window.history.back())}
          >
            Go Back
          </CustomButton>

          <CustomButton
            variant="contained"
            color="primary"
            onClick={onHome || (() => navigate('/'))}
          >
            Home
          </CustomButton>
        </Box>
      )}
    </Box>
  );
};

export default ErrorMessage;
