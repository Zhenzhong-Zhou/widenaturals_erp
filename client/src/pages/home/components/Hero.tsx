import type { FC } from 'react';
import { Box, Stack, Paper } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';
import { HeroListItem, MetaPill } from '@pages/home/components';

export interface HeroProps {
  onPrimary: () => void;
  onSecondary: () => void;
}

const Hero: FC<HeroProps> = ({ onPrimary, onSecondary }) => {
  return (
    <Box
      component="section"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: `
          linear-gradient(
            180deg,
            #1f2937 0%,
            rgba(47,143,70,0.45) 35%,
            rgba(226,232,240,0.45) 55%,
            #ffffff 80%
          )
        `,
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
            sx={{
              color: 'rgba(255,255,255,0.85)',
            }}
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
              color: '#ffffff',
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
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
            }}
          >
            Research, manufacturing, and distribution of premium natural health
            products—supported by Canadian cGMP operations and compliance-first
            execution.
          </CustomTypography>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 2.5, flexWrap: 'wrap' }}
          >
            <CustomButton
              variant="contained"
              size="medium"
              onClick={onPrimary}
              sx={{
                fontWeight: 600,
                backgroundColor: '#2f8f46',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#1f5f32',
                },
              }}
            >
              Contact Us
            </CustomButton>

            <CustomButton
              variant="outlined"
              size="medium"
              onClick={onSecondary}
              sx={{
                fontWeight: 600,
                color: '#2f8f46',
                borderColor: 'rgba(47,143,70,0.6)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(47,143,70,0.08)',
                  borderColor: '#2f8f46',
                },
              }}
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
              borderColor: 'rgba(255,255,255,0.12)',
              borderRadius: 3,
              p: 2.5,
              backgroundColor: 'rgba(15,23,42,0.85)',
              boxShadow: '0 10px 30px rgba(15,23,42,0.35)',
            }}
          >
            <CustomTypography
              variant="subtitle2"
              fontWeight={800}
              sx={{ color: '#ffffff' }}
              gutterBottom
            >
              Capabilities Snapshot
            </CustomTypography>

            <Box
              component="ul"
              sx={{ pl: 2, mt: 1, color: 'rgba(255,255,255,0.85)' }}
            >
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
