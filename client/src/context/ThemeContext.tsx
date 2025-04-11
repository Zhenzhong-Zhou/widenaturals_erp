import {
  createContext,
  useState,
  useEffect,
  useContext,
  type FC,
  type ReactNode,
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@styles/theme';
import type { Theme } from '@mui/material/styles';

// Context type
interface ThemeContextProps {
  toggleTheme: () => void;
  theme: Theme;
  mode: 'light' | 'dark';
}

// Create the context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Detect theme mode from system (SSR-safe)
const getSystemThemeMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

// Get initial mode from localStorage or system
const getInitialThemeMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  return stored === 'dark' || stored === 'light'
    ? stored
    : getSystemThemeMode();
};

// Provider component
export const ThemeProviderWrapper: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    getInitialThemeMode()
  );
  const [mounted, setMounted] = useState(false);

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newMode);
    setMode(newMode);
  };

  // Sync with system preference only if no localStorage override
  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (!localStorage.getItem('theme')) {
        setMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sync CSS variables with the active theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.palette.primary.main);
    root.style.setProperty('--secondary-color', theme.palette.secondary.main);
    root.style.setProperty('--bg-light', theme.palette.background.default);
    root.style.setProperty('--text-light', theme.palette.text.primary);
    root.style.setProperty('--border-light', theme.palette.divider);
  }, [theme]);

  if (!mounted) return null;

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
