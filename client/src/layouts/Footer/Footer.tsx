import type { FC } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useThemeContext } from '@context/ThemeContext';

const Footer: FC = () => {
  const { theme } = useThemeContext(); // From context
  const currentYear = new Date().getFullYear();
  
  return (
    <Container maxWidth="lg">
      <Box
        component="footer"
        sx={{
          display: 'flex',
          flexWrap: 'wrap', // allow stacking
          justifyContent: 'space-between',
          alignItems: 'center',
          rowGap: 1,
          columnGap: 2,
          px: 2, // horizontal spacing
          py: 1.5, // tighter vertical padding
          minHeight: 48, // keeps footer compact
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.secondary,
          fontFamily: "'Roboto', sans-serif",
          fontSize: '0.875rem', // equivalent to body2
          lineHeight: 1.6,
          textAlign: 'center', // fallback for smaller width
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          &copy; 2022 - {currentYear} Wide Naturals Inc. All Rights Reserved.
        </Box>
        
        <Box sx={{ flexShrink: 0 }}>
          Powered by{' '}
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              color: theme.palette.primary.main,
            }}
          >
            Bob Dev
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Footer;
