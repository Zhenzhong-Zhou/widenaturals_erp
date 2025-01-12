import { SxProps, Theme } from '@mui/material/styles';

export const headerStyles = (theme: Theme, darkMode: boolean, isSidebarOpen: boolean): SxProps<Theme> => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginLeft: isSidebarOpen ? '240px' : '0px', // Align with sidebar
  transition: 'margin-left 0.3s ease', // Smooth transition
  width: '100%', // Adjust width dynamically
  height: '60px', // Example height
  backgroundColor: darkMode ? 'primary.main' : '#f4f4f4', // Dynamic background color
  color: darkMode ? 'white' : 'black', // Dynamic text color
  padding: 2, // Dynamic padding
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
  marginRight: theme.spacing(2), // Use theme spacing for margins
});
