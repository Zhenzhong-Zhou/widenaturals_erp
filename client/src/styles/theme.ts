import {
  createTheme,
  type ThemeOptions,
  type Theme,
  type PaletteColor,
  type PaletteColorOptions,
} from '@mui/material/styles';

// Extend the palette with custom colors
declare module '@mui/material/styles' {
  interface Palette {
    actionCustom: {
      addNew: string;
      refresh: string;
    };
    backgroundCustom: {
      customDark: string;
      customHover: string;
    };
    stack: string;
    neutral: PaletteColor;
  }
  
  interface PaletteOptions {
    actionCustom?: {
      addNew?: string;
      refresh?: string;
    };
    backgroundCustom?: {
      customDark?: string;
      customHover?: string;
    };
    stack?: string;
    neutral?: PaletteColorOptions;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    neutral: true;
  }
}

// Define your shared tokens for consistency
const sharedTokens: ThemeOptions = {
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h1: {
      fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
      fontWeight: 700,
    },
    h2: {
      fontSize: 'clamp(2rem, 4vw, 3rem)',
      fontWeight: 700,
    },
    h3: {
      fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', // 20px–24px
      fontWeight: 600,
    },
    h6: {
      fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', // 16px–20px
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.8125rem', // ~13px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1.6,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  zIndex: {
    mobileStepper: 1000,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
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
    stack: '#f5f5f5',
    success: { main: '#28a745' },
    warning: { main: '#ffc107' },
    error: { main: '#dc3545' },
    info: { main: '#17a2b8' },
    actionCustom: {
      addNew: '#28a745',
      refresh: '#007bff',
    },
    backgroundCustom: {
      customDark: '#1a1a1a',
      customHover: '#2b2b2b',
    },
    neutral: {
      main: '#6c757d',
      contrastText: '#ffffff',
    },
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
    stack: '#424242',
    success: { main: '#28a745' },
    warning: { main: '#ffc107' },
    error: { main: '#dc3545' },
    info: { main: '#17a2b8' },
    actionCustom: {
      addNew: '#28a745',
      refresh: '#007bff',
    },
    backgroundCustom: {
      customDark: '#1a1a1a',
      customHover: '#2b2b2b',
    },
    neutral: {
      main: '#adb5bd',
      contrastText: '#1e1e1e',
    },
  },
});

export { lightTheme, darkTheme };
export type { Theme };
