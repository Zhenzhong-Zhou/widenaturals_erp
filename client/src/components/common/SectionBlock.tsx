import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';

interface SectionBlockProps {
  title?: string;
  children: ReactNode;
  gap?: number;          // space between title & content
  mt?: number;           // margin top
  mb?: number;           // margin bottom
  divider?: boolean;     // whether to show a divider under the title
}

/**
 * Generic reusable section wrapper.
 *
 * Usage:
 * <SectionBlock title="Pricing">
 *   <PricingInfoSection data={...} />
 * </SectionBlock>
 */
const SectionBlock: FC<SectionBlockProps> = ({
                                               title,
                                               children,
                                               gap = 2,
                                               mt = 4,
                                               mb = 0,
                                               divider = false,
                                             }) => {
  return (
    <Box sx={{ mt, mb }}>
      {title && (
        <Box sx={{ mb: gap }}>
          <CustomTypography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </CustomTypography>
          {divider && <Divider sx={{ mt: 1 }} />}
        </Box>
      )}
      
      {children}
    </Box>
  );
};

export default SectionBlock;
