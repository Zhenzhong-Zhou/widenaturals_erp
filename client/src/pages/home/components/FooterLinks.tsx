import type { FC } from 'react';
import { Box, Stack } from '@mui/material';
import { CustomTypography } from '@components/index';
import { FooterLink } from '@pages/home/components/index';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWeixin,
  faAmazon,
} from '@fortawesome/free-brands-svg-icons';

const FooterLinks: FC = () => {
  const footerIconSx = {
    fontSize: 16,
    opacity: 0.7,
    flexShrink: 0,
  };
  
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        gap: 3,
      }}
    >
      {/* OFFICIAL PRESENCE */}
      <Box>
        <CustomTypography variant="body2" fontWeight={700} gutterBottom>
          Official Presence
        </CustomTypography>
        
        <Stack spacing={0.75}>
          <FooterLink href="https://www.widenaturals.com" external>
            WIDE Naturals Inc. (Official Website)
          </FooterLink>
          <FooterLink href="https://www.linkedin.com/company/wide-naturals" external>
            <Stack direction="row" spacing={1} alignItems="center">
              <LinkedInIcon sx={footerIconSx} />
              <span>LinkedIn</span>
            </Stack>
          </FooterLink>
          <FooterLink href="https://www.instagram.com/widenaturals" external>
            <Stack direction="row" spacing={1} alignItems="center">
              <InstagramIcon sx={footerIconSx} />
              <span>Instagram</span>
            </Stack>
          </FooterLink>
          <FooterLink href="#" external>
            <Stack direction="row" spacing={1} alignItems="center">
              <FontAwesomeIcon
                icon={faWeixin}
                style={footerIconSx}
                aria-hidden
              />
              <span>WeChat Official Account</span>
            </Stack>
          </FooterLink>
        </Stack>
      </Box>
      
      {/* ONLINE PLATFORMS */}
      <Box>
        <CustomTypography variant="body2" fontWeight={700} gutterBottom>
          Online Platforms
        </CustomTypography>
        
        <Stack spacing={0.75}>
          <FooterLink href="https://www.amazon.ca/stores/WIDENaturalsInc/page/34DDF6DF-F58D-4B34-884E-A0DBF9F08144" external>
            <Stack direction="row" spacing={1} alignItems="center">
              <FontAwesomeIcon
                icon={faAmazon}
                style={footerIconSx}
                aria-hidden />
              <span>Amazon</span>
            </Stack>
          </FooterLink>
          <FooterLink href="https://phytogenious.com" external>
            Phyto-Genious®
          </FooterLink>
          <FooterLink href="https://www.canaherb.com" external>
            Canaherb®
          </FooterLink>
          <FooterLink href="https://www.tmall.com" external>
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Tmall</span>
            </Stack>
          </FooterLink>
          <FooterLink href="https://www.jd.com" external>
            <Stack direction="row" spacing={1} alignItems="center">
              <span>JD.com</span>
            </Stack>
          </FooterLink>
        </Stack>
      </Box>
    </Box>
  );
};

export default FooterLinks;
