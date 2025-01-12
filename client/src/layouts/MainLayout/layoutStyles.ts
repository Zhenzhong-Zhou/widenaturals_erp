import { SxProps, Theme } from '@mui/material/styles';

export const layoutStyles = (darkMode: boolean): SxProps<Theme> => ({
  backgroundColor: darkMode ? '#121212' : '#f4f4f4', // Dark/Light background
});

export const contentContainerStyles = (darkMode: boolean): SxProps<Theme> => ({
  backgroundColor: darkMode ? '#121212' : '#ffffff', // Dark/Light background for content area
});

export const mainContentStyles = (): SxProps<Theme> => ({
  flex: 1,
  padding: (theme) => theme.spacing(2), // Use theme spacing for consistency
});
