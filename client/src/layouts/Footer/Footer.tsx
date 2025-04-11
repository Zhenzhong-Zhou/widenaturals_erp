import type { FC } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CustomTypography from '@components/common/CustomTypography';
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
            <CustomTypography variant="body2" color="text.secondary">
              &copy; 2022 - {new Date().getFullYear()} Wide Naturals Inc. All
              Rights Reserved.
            </CustomTypography>
          </Box>

          {/* Powered By */}
          <Box>
            <CustomTypography variant="body2" color="text.secondary">
              Powered by{' '}
              <CustomTypography
                component="span"
                variant="body2"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                Bob Dev
              </CustomTypography>
            </CustomTypography>
          </Box>
        </Box>
      </Container>
    </footer>
  );
};

export default Footer;
