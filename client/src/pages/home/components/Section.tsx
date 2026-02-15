import type { FC, PropsWithChildren } from 'react';
import { Box } from '@mui/material';
import { CustomTypography } from '@components/index';

export interface SectionProps extends PropsWithChildren {
  id: string;
  title: string;
  subtitle?: string;
}

const Section: FC<SectionProps> = ({ id, title, subtitle, children }) => {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        scrollMarginTop: 88,
        py: 5.5,
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 2.5 }}>
          <CustomTypography
            variant="h4"
            sx={{ fontWeight: 700, letterSpacing: -0.2 }}
          >
            {title}
          </CustomTypography>

          {subtitle && (
            <CustomTypography
              variant="body2"
              sx={{
                mt: 1,
                color: 'text.secondary',
                lineHeight: 1.5,
                maxWidth: 720,
              }}
            >
              {subtitle}
            </CustomTypography>
          )}
        </Box>

        {children}
      </Box>
    </Box>
  );
};

export default Section;
