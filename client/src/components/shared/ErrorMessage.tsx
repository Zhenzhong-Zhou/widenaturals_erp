import { FC } from 'react';
import Box from '@mui/material/Box';

interface ErrorMessageProps {
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

const ErrorMessage: FC<ErrorMessageProps> = ({ message, severity = 'error' }) => {
  const severityColorMap = {
    error: 'error.main',
    warning: 'warning.main',
    info: 'info.main',
  };
  
  return (
    <Box
      sx={{
        color: severityColorMap[severity],
        fontSize: 14,
        margin: '10px 0',
      }}
      role="alert"
      aria-live="polite"
    >
      {message}
    </Box>
  );
};

export default ErrorMessage;
