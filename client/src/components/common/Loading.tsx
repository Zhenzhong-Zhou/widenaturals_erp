import { FC } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useThemeContext } from '../../context/ThemeContext.tsx';

interface LoadingProps {
  size?: number; // Customize size for CircularProgress
  message?: string; // Optional message
  color?: 'primary' | 'secondary' | 'inherit'; // Color customization
  variant?: 'spinner' | 'linear'| 'dotted'; // Loader variant
  fullPage?: boolean; // Whether to display as a full-page loader
}

const Loading: FC<LoadingProps> = ({ size = 40, message, color = 'primary', variant, fullPage = false }) => {
  const { theme } = useThemeContext();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...(fullPage && {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: theme.zIndex.modal,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }),
        ...(variant === 'dotted' && {
          // Example for a custom dotted loader
          '& > .MuiCircularProgress-root': {
            animation: 'spin 1s linear infinite',
            border: `4px dotted ${theme.palette.primary.main}`,
            borderRadius: '50%',
            height: size,
            width: size,
          },
        }),
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {variant === 'spinner' ? (
        <CircularProgress size={size} color={color} />
      ) : variant === 'dotted' ? (
        <div> {/* Custom loader for 'dotted' */}
          Loading...
        </div>
      ) : (
        <Box sx={{ width: '100%' }}>
          <LinearProgress color={color} />
        </Box>
      )}
      {message && (
        <Box mt={2} sx={{ typography: 'body2', color: 'text.secondary' }}>
          {message}
        </Box>
      )}
    </Box>
  );
};

export default Loading;
