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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }
    : {};

  // Dotted Loader Styles
  const dottedLoader = (
    <Box
      sx={{
        width: size,
        height: size,
        border: `4px dotted ${theme.palette.primary.main}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
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
        return <CircularProgress size={size} color={color} />; // Fallback to spinner
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...fullPageStyles,
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {renderLoader()}
      {message && (
        <Box mt={2} sx={{ typography: 'body2', color: 'text.secondary' }}>
          {message}
        </Box>
      )}
    </Box>
  );
};

export default Loading;
