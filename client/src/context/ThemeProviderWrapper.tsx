import { useLayoutEffect, type FC, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@styles/theme';
import useThemeMode from '@hooks/useThemeMode';

/**
 * ThemeProviderWrapper
 *
 * Responsibility:
 * - Bridges persisted theme preference (Redux) with MUI's ThemeProvider.
 *
 * Architectural role:
 * - Application-level provider
 * - UX-only concern
 * - No business logic
 * - No authentication or session awareness
 *
 * Data flow:
 * - Reads theme *preference* (`light | dark`) from Redux via `useThemeMode`
 * - Resolves the concrete MUI theme object
 * - Provides the theme to the component tree
 *
 * Persistence semantics:
 * - Theme preference is persisted in Redux
 * - This provider is re-evaluated automatically after rehydration
 *
 * Explicitly NOT responsible for:
 * - Managing theme state
 * - Writing to localStorage
 * - Exposing toggle or setter APIs
 *
 * Usage:
 * - Must wrap the application root
 * - Must not be used inside feature modules
 */
const ThemeProviderWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { mode } = useThemeMode();

  // Resolve concrete MUI theme
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  /**
   * Sync selected theme values to CSS variables.
   *
   * Purpose:
   * - Enables non-MUI styling (e.g. plain CSS, legacy components)
   * - Keeps CSS variables consistent with the active theme
   *
   * Notes:
   * - useLayoutEffect prevents visual flicker during theme changes
   * - Safe because this provider only runs in the browser
   */
  useLayoutEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--primary-color', theme.palette.primary.main);
    root.style.setProperty('--secondary-color', theme.palette.secondary.main);
    root.style.setProperty('--bg-default', theme.palette.background.default);
    root.style.setProperty('--bg-paper', theme.palette.background.paper);
    root.style.setProperty('--text-primary', theme.palette.text.primary);
    root.style.setProperty('--text-secondary', theme.palette.text.secondary);
    root.style.setProperty('--border-light', theme.palette.divider);
    root.style.setProperty(
      '--hover-bg',
      theme.palette.backgroundCustom?.customHover ?? '#eee'
    );
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeProviderWrapper;
