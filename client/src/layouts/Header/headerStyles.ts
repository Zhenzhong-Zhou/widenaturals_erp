import { SxProps, Theme } from '@mui/material/styles';

export const headerStyles = (darkMode: boolean, isSidebarOpen: boolean): SxProps<Theme> => ({
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
  '@media (max-width: 768px)': {
    flexDirection: 'column', // Responsive stacking
    textAlign: 'center', // Responsive text alignment
  },
});

export const userInfoStyles = {
  display: 'flex',
  alignItems: 'center',
};

export const typographyStyles = {
  marginRight: 2,
};
