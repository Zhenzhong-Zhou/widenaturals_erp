import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  FC,
} from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../styles/theme';
import { Theme } from '@mui/material/styles';

// Define the shape of the context
interface ThemeContextProps {
  toggleTheme: () => void;
  theme: Theme;
}

// Create the context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Helper function to get the initial theme
const getInitialTheme = (): Theme => {
  // Check localStorage for a saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    return darkTheme;
  }
  if (savedTheme === 'light') {
    return lightTheme;
  }
  
  // Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? darkTheme
    : lightTheme;
};

// Create a provider component
export const ThemeProviderWrapper: FC<{ children: ReactNode }> = ({
                                                                    children,
                                                                  }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  
  // Toggle theme and persist user preference
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === darkTheme ? lightTheme : darkTheme;
      localStorage.setItem('theme', newTheme === darkTheme ? 'dark' : 'light');
      return newTheme;
    });
  };
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // If no user preference is set, update based on system theme
      if (!localStorage.getItem('theme')) {
        setTheme(mediaQuery.matches ? darkTheme : lightTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <ThemeContext.Provider value={{ toggleTheme, theme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useThemeContext = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProviderWrapper');
  }
  return context;
};
