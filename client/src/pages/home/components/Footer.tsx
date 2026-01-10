import type { FC } from 'react';
import { Box, Divider } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';
import { FooterLinks } from '@pages/home/components';

export interface FooterProps {
  onStaffLogin: () => void;
}

const Footer: FC<FooterProps> = ({ onStaffLogin }) => {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 3,
        mt: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 1120,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' },
          columnGap: { md: 6 },
        }}
      >
        {/* COMPANY */}
        <Box>
          <CustomTypography variant="body2" fontWeight={800}>
            © {new Date().getFullYear()} WIDE Naturals Inc.
          </CustomTypography>
          <CustomTypography
            variant="caption"
            sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}
          >
            All rights reserved.
          </CustomTypography>
          
          <CustomTypography
            variant="caption"
            sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}
          >
            Vancouver, British Columbia, Canada
          </CustomTypography>
        </Box>
        
        {/* OFFICIAL PRESENCE */}
        <Box>
          {/* LINKS */}
          <FooterLinks />
          
          <Divider sx={{ my: 1.5 }} />
          
          <CustomButton
            variant="outlined"
            size="small"
            onClick={onStaffLogin}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 1.5,
            }}
          >
            Staff Login
          </CustomButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
