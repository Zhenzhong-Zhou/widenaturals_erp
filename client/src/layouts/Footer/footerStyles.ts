import { SxProps, Theme } from '@mui/material/styles';

export const footerStyles = (theme: Theme, darkMode: boolean, isSidebarOpen: boolean): SxProps<Theme> => ({
  marginLeft: isSidebarOpen ? '240px' : '0px', // Align with sidebar
  transition: 'margin-left 0.3s ease', // Smooth transition
  width: '100%', // Adjust width dynamically
  height: '40px', // Example height
  display: 'flex', // Flexbox layout
  flexDirection: 'row', // Default flex direction
  justifyContent: 'space-between', // Spacing between items
  alignItems: 'center', // Center items vertically
  padding: theme.spacing(2), // Use theme.spacing for consistent padding
  borderTop: `1px solid ${darkMode ? theme.palette.grey[800] : 'rgba(255, 255, 255, 0.2)'}`, // Dynamic border
  backgroundColor: darkMode ? theme.palette.background.default : theme.palette.secondary.light, // Dynamic background
  color: darkMode ? theme.palette.text.primary : theme.palette.text.secondary, // Dynamic text color
  
  // Responsive styles
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column', // Stack items vertically on medium and smaller screens
    padding: theme.spacing(1.5), // Reduce padding
    height: 'auto', // Adjust height for content
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1), // Further reduce padding on small screens
  },
});

export const footerTextStyle = (theme: Theme): SxProps<Theme> => ({
  marginBottom: theme.spacing(2), // Use theme.spacing for consistency
  [theme.breakpoints.up('md')]: {
    marginBottom: 0, // Reset margin for larger screens
  },
});
