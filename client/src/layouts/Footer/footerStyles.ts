import { SxProps, Theme } from '@mui/material/styles';

export const footerStyles = (theme: Theme, isSidebarOpen: boolean): SxProps<Theme> => ({
  marginLeft: isSidebarOpen ? '240px' : '0px', // Align with sidebar
  transition: 'margin-left 0.3s ease', // Smooth transition
  width: '100%', // Adjust width dynamically
  height: '40px', // Example height
  display: 'flex', // Flexbox layout
  flexDirection: 'row', // Default flex direction
  justifyContent: 'space-between', // Spacing between items
  alignItems: 'center', // Center items vertically
  padding: theme.spacing(2), // Use theme.spacing for consistent padding
  borderTop: `1px solid ${theme.palette.divider}`, // Dynamic border color
  backgroundColor: theme.palette.background.default, // Dynamic background color
  color: theme.palette.text.primary, // Dynamic text color
  
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
