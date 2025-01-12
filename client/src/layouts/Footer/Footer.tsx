import { FC } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { footerStyles, footerTextStyle } from './footerStyles'; // Import the abstracted styles
import { useThemeContext } from '../../context/ThemeContext.tsx'; // Import Theme Context

interface FooterProps {
  isSidebarOpen: boolean;
}

const Footer: FC<FooterProps> = ({ isSidebarOpen }) => {
  const { theme } = useThemeContext(); // Access the current theme from context
  
  return (
    <footer>
      <Container maxWidth="lg">
        <Box sx={footerStyles(theme, isSidebarOpen)}>
          {/* Copyright Information */}
          <Box sx={footerTextStyle(theme)}>
            <Typography variant="body2" color="textSecondary">
              &copy; 2022 - 2024 Wide Naturals Inc. All Rights Reserved.
            </Typography>
          </Box>
          
          {/* Powered By */}
          <Box>
            <Typography variant="body2" color="textSecondary">
              Powered By Bob Dev
            </Typography>
          </Box>
        </Box>
      </Container>
    </footer>
  );
};

export default Footer;
