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

// Define the shape of the context
interface ThemeContextProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Helper function to get the initial theme
const getInitialTheme = (): boolean => {
  // Check localStorage for a saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme === 'dark';
  }
  
  // Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Create a provider component
export const ThemeProviderWrapper: FC<{ children: ReactNode }> = ({
                                                                    children,
                                                                  }) => {
  const [darkMode, setDarkMode] = useState<boolean>(getInitialTheme);
  
  // Toggle theme and persist user preference
  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // If no user preference is set, update based on system theme
      if (!localStorage.getItem('theme')) {
        setDarkMode(mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
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
