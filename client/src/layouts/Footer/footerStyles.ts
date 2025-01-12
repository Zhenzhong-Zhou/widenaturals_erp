import { SxProps, Theme } from '@mui/material/styles';

export const footerStyles = (darkMode: boolean): SxProps<Theme> => ({
  display: 'flex', // Flexbox layout
  flexDirection: { xs: 'column', md: 'row' }, // Responsive layout
  justifyContent: 'space-between', // Spacing between items
  alignItems: 'center', // Center items vertically
  padding: '16px', // Static padding to replace App.css reference
  borderTop: `1px solid ${darkMode ? '#333' : 'rgba(255, 255, 255, 0.2)'}`, // Dynamic border
  backgroundColor: darkMode ? '#121212' : 'var(--secondary-color)', // Use CSS variable for light mode
  color: darkMode ? 'white' : 'black', // Dynamic text color
});

export const footerTextStyle = {
  marginBottom: { xs: 2, md: 0 },
};
