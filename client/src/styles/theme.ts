import { createTheme, ThemeOptions, Theme } from '@mui/material/styles';

// Sync global CSS variables with theme
const syncGlobalVariables = (theme: Theme) => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.palette.primary.main);
  root.style.setProperty('--secondary-color', theme.palette.secondary.main);
  root.style.setProperty('--bg-light', theme.palette.background.default);
  root.style.setProperty('--text-light', theme.palette.text.primary);
  root.style.setProperty('--border-light', theme.palette.divider);
};

// Shared tokens
const sharedTokens: ThemeOptions = {
  typography: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: 16, // Base font size
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.7 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
  },
  spacing: 8,
};

// Light theme
const lightTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'light',
    primary: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
    secondary: { main: '#ff5722', light: '#ff8a50', dark: '#e64a19' },
    background: { default: '#f4f4f4', paper: '#ffffff' },
    text: { primary: '#333', secondary: '#555' },
    divider: '#dcdcdc',
    success: { main: '#28a745' },
    warning: { main: '#ffc107' },
    error: { main: '#dc3545' },
    info: { main: '#17a2b8' },
  },
});

// Dark theme
const darkTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'dark',
    primary: { main: '#4caf50', light: '#81c784', dark: '#388e3c' },
    secondary: { main: '#ff5722', light: '#ff8a50', dark: '#e64a19' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#f4f4f4', secondary: '#ccc' },
    divider: '#333',
    success: { main: '#28a745' },
    warning: { main: '#ffc107' },
    error: { main: '#dc3545' },
    info: { main: '#17a2b8' },
  },
});

// Apply global variables dynamically
syncGlobalVariables(lightTheme);
syncGlobalVariables(darkTheme);

export { lightTheme, darkTheme };
export type { Theme };
