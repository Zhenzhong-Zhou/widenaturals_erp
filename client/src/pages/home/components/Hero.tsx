import type { FC } from 'react';
import { Box, Stack, Paper, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CustomButton, CustomTypography } from '@components/index';
import { HeroListItem, MetaPill } from '@pages/home/components';

export interface HeroProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

const Hero: FC<HeroProps> = ({ onPrimary, onSecondary }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const heroBackground = isDark
    ? `
        radial-gradient(ellipse 90% 60% at 15% 0%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 60%),
        linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)
      `
    : `
        radial-gradient(ellipse 90% 60% at 15% 0%, ${alpha(theme.palette.primary.light, 0.22)}, transparent 60%),
        linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.06)} 0%, ${theme.palette.background.default} 100%)
      `;

  return (
    <Box
      component="section"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: heroBackground,
      }}
    >
      <Box
        sx={{
          maxWidth: 1120,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 6, md: 8 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* LEFT */}
        <Box>
          {/* Overline */}
          <CustomTypography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            WIDE Naturals Inc.
          </CustomTypography>

          {/* Headline */}
          <CustomTypography
            variant="h2"
            sx={{
              mt: 1.5,
              fontWeight: 700,
              letterSpacing: -0.6,
              lineHeight: 1.1,
              color: 'text.primary',
            }}
          >
            Crafted Natural Health Products, Built for Global Markets
          </CustomTypography>

          {/* Description */}
          <CustomTypography
            variant="body1"
            sx={{
              mt: 2,
              maxWidth: 640,
              color: 'text.secondary',
              lineHeight: 1.6,
            }}
          >
            Research, manufacturing, and distribution of premium natural health
            products—supported by Canadian cGMP operations and compliance-first
            execution.
          </CustomTypography>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 2.5, flexWrap: 'wrap' }}
          >
            <CustomButton
              variant="contained"
              color="primary"
              size="medium"
              onClick={onPrimary}
              sx={{ fontWeight: 600 }}
            >
              Contact Us
            </CustomButton>

            <CustomButton
              variant="outlined"
              color="primary"
              size="medium"
              onClick={onSecondary}
              sx={{ fontWeight: 600 }}
            >
              Explore Capabilities
            </CustomButton>
          </Stack>

          {/* Meta pills */}
          <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap' }}>
            <MetaPill label="R&D + Formulation" />
            <MetaPill label="cGMP Manufacturing" />
            <MetaPill label="Regulatory Readiness" />
            <MetaPill label="Global Distribution" />
          </Stack>
        </Box>

        {/* RIGHT */}
        <Box aria-hidden>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              p: 2.5,
              backgroundColor: 'background.paper',
              boxShadow: (t) =>
                t.palette.mode === 'dark'
                  ? '0 10px 30px rgba(0,0,0,0.45)'
                  : '0 10px 30px rgba(15,23,42,0.08)',
            }}
          >
            <CustomTypography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: 'text.primary'
            }}
              gutterBottom
            >
              Capabilities Snapshot
            </CustomTypography>

            <Box component="ul" sx={{ pl: 2, mt: 1, m: 0 }}>
              <HeroListItem>Capsules • Tablets • Gummies</HeroListItem>
              <HeroListItem>Softgels • Tinctures</HeroListItem>
              <HeroListItem>QA/QC and compliance alignment</HeroListItem>
              <HeroListItem>
                Online + offline distribution channels
              </HeroListItem>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Hero;
