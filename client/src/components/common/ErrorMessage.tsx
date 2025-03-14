import { FC } from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import { useThemeContext } from '../../context/ThemeContext';

interface ErrorMessageProps extends BoxProps {
  message: string | null; // Error message to display
  severity?: 'error' | 'warning' | 'info'; // Severity levels
}

const ErrorMessage: FC<ErrorMessageProps> = ({
  message,
  severity = 'error',
  sx,
  ...props
}) => {
  const { theme } = useThemeContext();
  const severityColorMap = {
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  return (
    <Box
      sx={{
        color: severityColorMap[severity],
        fontSize: theme.typography.body2.fontSize,
        margin: theme.spacing(1, 0),
        ...sx, // Spread custom styles
      }}
      role="alert"
      aria-live="polite"
      {...props} // Spread additional Box props
    >
      {message}
    </Box>
  );
};

export default ErrorMessage;
