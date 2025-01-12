import { SxProps, Theme } from '@mui/material/styles';

export const sidebarStyles = (darkMode: boolean, isSidebarOpen: boolean): SxProps<Theme> => ({
  width: isSidebarOpen ? '240px' : '0px', // Sidebar disappears when closed
  transition: 'width 0.3s ease', // Smooth transition for the width
  flexShrink: 0,
  height: '100vh', // Full height
  backgroundColor: darkMode ? '#121212' : '#f4f4f4', // Dark/light mode background
  color: darkMode ? 'white' : 'black', // Text color
  display: 'flex',
  flexDirection: 'column',
  boxShadow: isSidebarOpen ? '2px 0 5px rgba(0, 0, 0, 0.1)' : 'none', // Box shadow only when open
  overflowY: 'auto', // Enable scrolling if content overflows
  
  '& ul': {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  
  '& li': {
    margin: '12px 0',
  },
  
  '& a': {
    textDecoration: 'none',
    color: darkMode ? 'white' : 'black',
    fontSize: '1rem',
    '&:hover': {
      color: darkMode ? '#ff5722' : '#4caf50',
    },
  },
});
