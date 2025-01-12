import { SxProps, Theme } from '@mui/material/styles';

export const layoutStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'row',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column', // Stack layout on smaller screens
  },
});

export const contentContainerStyles = (theme: Theme): SxProps<Theme> => ({
  flex: 1,
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh', // Ensure full height of the viewport
  [theme.breakpoints.down('md')]: {
    marginLeft: '0px', // Collapse sidebar on medium and smaller screens
  },
});

export const mainContentStyles = (theme: Theme): SxProps<Theme> => ({
  flex: 1,
  padding: theme.spacing(2), // Use Material-UI's theme spacing
  overflow: 'auto', // Ensure scrollability for long content
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1), // Reduced padding on small screens
  },
});
