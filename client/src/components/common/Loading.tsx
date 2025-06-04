import type { FC } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { useThemeContext } from '@context/ThemeContext';

interface LoadingProps {
  size?: number; // Customize size for CircularProgress
  message?: string; // Optional message
  color?: 'primary' | 'secondary' | 'inherit'; // Color customization
  variant?: 'spinner' | 'linear' | 'dotted'; // Loader variant
  fullPage?: boolean; // Whether to display as a full-page loader
}

const Loading: FC<LoadingProps> = ({
  size = 40,
  message,
  color = 'primary',
  variant = 'spinner',
  fullPage = false,
}) => {
  const { theme } = useThemeContext();

  // Utility function to generate full-page styles
  const fullPageStyles = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: theme.zIndex.modal,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(18, 18, 18, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(2px)',
      }
    : {};

  // Dotted Loader Styles
  const dottedLoader = (
    <Box
      sx={{
        width: size,
        height: size,
        border: `3px dotted ${theme.palette.primary.main}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      }}
    />
  );

  // Loader content based on variant
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <CircularProgress size={size} color={color} />;
      case 'linear':
        return (
          <Box sx={{ width: '100%' }}>
            <LinearProgress color={color} />
          </Box>
        );
      case 'dotted':
        return dottedLoader;
      default:
        return <CircularProgress size={size} color={color} />;
    }
  };

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullPage ? '100vh' : 64, // ensure layout stability
        px: 2,
        ...fullPageStyles,
      }}
    >
      {renderLoader()}
      {message && (
        <Box
          mt={2}
          sx={{
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.text.secondary,
            textAlign: 'center',
          }}
        >
          {message}
        </Box>
      )}
    </Box>
  );
};

export default Loading;
