import { FC } from 'react';
import Box from '@mui/material/Box';
import { useThemeContext } from '../../context/ThemeContext.tsx';

interface ErrorMessageProps {
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

const ErrorMessage: FC<ErrorMessageProps> = ({ message, severity = 'error' }) => {
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
      }}
      role="alert"
      aria-live="polite"
    >
      {message}
    </Box>
  );
};

export default ErrorMessage;
