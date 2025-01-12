import { SxProps, Theme } from '@mui/material/styles';

export const layoutStyles = (darkMode: boolean): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'row',
  minHeight: '100vh',
  backgroundColor: darkMode ? '#121212' : '#f4f4f4',
});

export const contentContainerStyles = (darkMode: boolean): SxProps<Theme> => ({
  flex: 1,
  width: '100%',
  backgroundColor: darkMode ? '#121212' : '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh', // Ensure full height of the viewport
  [`@media (max-width: 768px)`]: {
    marginLeft: '0px', // Collapse the sidebar on small screens
  },
});

export const mainContentStyles = (): SxProps<Theme> => ({
  flex: 1,
  padding: (theme) => theme.spacing(2), // Use Material-UI's theme spacing
  overflow: 'auto', // Ensure scrollability for long content
});
