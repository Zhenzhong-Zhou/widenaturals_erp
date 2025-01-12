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
    fontSize: 14,
    h1: { fontSize: '2.25rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  },
  spacing: 8,
};

// Light theme
const lightTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'light',
    primary: { main: '#4caf50' },
    secondary: { main: '#ff5722' },
    background: { default: '#f4f4f4', paper: '#ffffff' },
    text: { primary: '#333', secondary: '#555' },
    divider: '#e0e0e0',
  },
});

// Dark theme
const darkTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'dark',
    primary: { main: '#4caf50' },
    secondary: { main: '#ff5722' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#f4f4f4', secondary: '#ccc' },
    divider: '#333',
  },
});

// Apply global variables dynamically
syncGlobalVariables(lightTheme);
syncGlobalVariables(darkTheme);

export { lightTheme, darkTheme };
export type { Theme };
