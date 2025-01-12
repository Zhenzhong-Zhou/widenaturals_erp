import { SxProps, Theme } from '@mui/material/styles';

export const sidebarStyles = (
  theme: Theme,
  isSidebarOpen: boolean
): SxProps<Theme> => ({
  width: isSidebarOpen ? '240px' : '0px', // Sidebar disappears when closed
  transition: 'width 0.3s ease', // Smooth transition for the width
  flexShrink: 0,
  height: '100vh', // Full height
  backgroundColor: theme.palette.background.default, // Dynamic background color
  color: theme.palette.text.primary, // Dynamic text color
  display: 'flex',
  flexDirection: 'column',
  boxShadow: isSidebarOpen ? '2px 0 5px rgba(0, 0, 0, 0.1)' : 'none', // Box shadow only when open
  overflowY: 'auto', // Enable scrolling if content overflows
  
  // Responsive breakpoints
  [theme.breakpoints.down('md')]: {
    position: 'fixed', // Sidebar becomes fixed on medium screens
    zIndex: 1300, // Ensure it's above other content
    width: isSidebarOpen ? '240px' : '0px', // Collapsed width for smaller screens
    boxShadow: isSidebarOpen ? '2px 0 10px rgba(0, 0, 0, 0.2)' : 'none',
  },
  
  [theme.breakpoints.down('sm')]: {
    width: isSidebarOpen ? '100%' : '0px', // Full-width sidebar on small screens
    height: '100%', // Full screen height
    position: 'fixed', // Overlay style on small screens
    zIndex: 1400,
  },
  
  '& ul': {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  
  '& li': {
    margin: theme.spacing(1.5), // Use theme spacing for margins
  },
  
  '& a': {
    textDecoration: 'none',
    color: theme.palette.text.primary, // Dynamic link color
    fontSize: '1rem',
    '&:hover': {
      color: theme.palette.primary.main, // Dynamic hover color
    },
  },
});
