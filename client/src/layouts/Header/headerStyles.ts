import { SxProps, Theme } from '@mui/material/styles';

export const headerStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%', // Adjust width dynamically
  height: '60px', // Example height
  backgroundColor: theme.palette.background.default, // Dynamic background color
  color: theme.palette.text.primary, // Dynamic text color
  padding: theme.spacing(2), // Use theme.spacing for consistent padding
  flexDirection: 'row',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column', // Responsive stacking for medium screens
    textAlign: 'center', // Center-align text on smaller screens
  },
});

export const userInfoStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column', // Stack user info vertically on small screens
    textAlign: 'center', // Center-align text
  },
});

export const typographyStyles = (theme: Theme): SxProps<Theme> => ({
  marginRight: theme.spacing(2), // Use theme.spacing for margins
});
