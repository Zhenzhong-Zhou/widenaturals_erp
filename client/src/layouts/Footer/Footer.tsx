import { FC } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@components/common/Typography';
import { footerStyles, footerTextStyle } from '@layouts/Footer/footerStyles';
import { useThemeContext } from '@context/ThemeContext';

const Footer: FC = () => {
  const { theme } = useThemeContext(); // Access the current theme from context

  return (
    <footer>
      <Container maxWidth="lg">
        <Box sx={footerStyles(theme)}>
          {/* Copyright Information */}
          <Box sx={footerTextStyle(theme)}>
            <Typography variant="body2" color="text.secondary">
              &copy; 2022 - {new Date().getFullYear()} Wide Naturals Inc. All
              Rights Reserved.
            </Typography>
          </Box>

          {/* Powered By */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Powered by{' '}
              <Typography
                component="span"
                variant="body2"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                Bob Dev
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Container>
    </footer>
  );
};

export default Footer;
