import type { FC } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import type { Theme, SxProps } from '@mui/material/styles';
import { useThemeContext } from '@context/ThemeContext';

interface LoadingProps {
  /** Size for circular loaders */
  size?: number;
  
  /** Optional user-facing loading message */
  message?: string;
  
  /** MUI color token */
  color?: 'primary' | 'secondary' | 'inherit';
  
  /** Loader style */
  variant?: 'spinner' | 'linear' | 'dotted';
  
  /** Whether to render as a full-page overlay */
  fullPage?: boolean;
}

/**
 * Loading
 *
 * Generic, theme-aware loading indicator.
 *
 * Responsibilities:
 * - Display loading feedback without side effects
 * - Respect active MUI theme (light / dark)
 * - Support inline and full-page usage
 *
 * MUST NOT:
 * - Trigger async logic
 * - Perform state changes
 */
const Loading: FC<LoadingProps> = ({
                                     size = 40,
                                     message,
                                     color = 'primary',
                                     variant = 'spinner',
                                     fullPage = false,
                                   }) => {
  const { theme } = useThemeContext();
  
  /* ----------------------------------------
   * Full-page overlay styles (optional)
   * -------------------------------------- */
  const fullPageStyles: SxProps<Theme> | undefined = fullPage
    ? (theme) => ({
      position: 'fixed',
      inset: 0,
      zIndex: theme.zIndex.modal,
      backgroundColor: alpha(
        theme.palette.background.default,
        0.85
      ),
      backdropFilter: 'blur(2px)',
    })
    : undefined;
  
  /* ----------------------------------------
   * Dotted loader (custom)
   * -------------------------------------- */
  const dottedLoader = (
    <Box
      sx={{
        width: size,
        height: size,
        border: `3px dotted ${theme.palette.primary.main}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
    />
  );
  
  /* ----------------------------------------
   * Loader renderer
   * -------------------------------------- */
  const renderLoader = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%' }}>
            <LinearProgress color={color} />
          </Box>
        );
      case 'dotted':
        return dottedLoader;
      case 'spinner':
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
        minHeight: fullPage ? '100vh' : 64,
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
