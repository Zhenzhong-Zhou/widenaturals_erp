import { SxProps, Theme } from '@mui/material/styles';

export const layoutStyles = (theme: Theme, darkMode: boolean): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'row',
  minHeight: '100vh',
  backgroundColor: darkMode ? '#121212' : '#f4f4f4',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column', // Stack layout on smaller screens
  },
});

export const contentContainerStyles = (theme: Theme, darkMode: boolean): SxProps<Theme> => ({
  flex: 1,
  width: '100%',
  backgroundColor: darkMode ? '#121212' : '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh', // Ensure full height of the viewport
  [theme.breakpoints.down('md')]: {
    marginLeft: '0px', // Collapse sidebar on medium and smaller screens
  },
});

export const mainContentStyles = (theme: Theme): SxProps<Theme> => ({
  flex: 1,
  padding: (theme) => theme.spacing(2), // Use Material-UI's theme spacing
  overflow: 'auto', // Ensure scrollability for long content
  [theme.breakpoints.down('sm')]: {
    padding: (theme) => theme.spacing(1), // Reduced padding on small screens
  },
});
