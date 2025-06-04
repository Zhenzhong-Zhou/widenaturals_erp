import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { lightTheme, darkTheme } from '@styles/theme';
import type { Theme } from '@mui/material/styles';
import useThemeMode from '@hooks/useThemeMode.ts';

// Context type
interface ThemeContextProps {
  toggleTheme: () => void;
  theme: Theme;
  mode: 'light' | 'dark';
}

// Create the context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProviderWrapper: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { mode, toggleTheme } = useThemeMode();
  const [mounted, setMounted] = useState(false);

  // Memoize theme based on mode
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  // Avoid hydration mismatch flicker
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Sync CSS variables (optional)
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

  // Avoid rendering anything until hydration is consistent
  if (!mounted) return <Box style={{ opacity: 0 }}>Loading theme...</Box>;

  return (
    <ThemeContext.Provider value={{ toggleTheme, theme, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook
export const useThemeContext = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      'useThemeContext must be used within a ThemeProviderWrapper'
    );
  }
  return context;
};
