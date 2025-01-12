import { SxProps, Theme } from '@mui/material/styles';

export const sidebarStyles = (darkMode: boolean): SxProps<Theme> => ({
  backgroundColor: darkMode ? '#121212' : '#f4f4f4', // Dynamic background color
  color: darkMode ? 'white' : 'black', // Dynamic text color
  borderRight: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, // Dynamic border
  
  '& a': {
    color: darkMode ? 'white' : 'black', // Dynamic link color
    '&:hover': {
      color: darkMode ? '#ff5722' : '#4caf50', // Dynamic hover color
    },
  },
  
  // Responsive adjustments
  '@media (max-width: 768px)': {
    width: '200px',
    padding: '8px',
  },
});
