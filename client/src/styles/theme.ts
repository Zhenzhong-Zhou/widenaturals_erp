import { createTheme, ThemeOptions, Theme } from '@mui/material/styles';

// Shared design tokens
const sharedTokens: ThemeOptions = {
  typography: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: 14,
    h1: { fontSize: '2.25rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  },
  spacing: 8, // Default spacing (can be used as theme.spacing(n))
};

// Light theme
const lightTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'light',
    primary: {
      main: '#4caf50',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff5722',
      contrastText: '#fff',
    },
    background: {
      default: '#f4f4f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#333',
      secondary: '#555',
    },
    success: {
      main: '#28a745',
    },
    error: {
      main: '#dc3545',
    },
    warning: {
      main: '#ffc107',
    },
    info: {
      main: '#17a2b8',
    },
  },
});

// Dark theme
const darkTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff5722',
      contrastText: '#fff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#f4f4f4',
      secondary: '#ccc',
    },
    success: {
      main: '#28a745',
    },
    error: {
      main: '#dc3545',
    },
    warning: {
      main: '#ffc107',
    },
    info: {
      main: '#17a2b8',
    },
  },
});

// Export themes and types
export { lightTheme, darkTheme };
export type { Theme };
