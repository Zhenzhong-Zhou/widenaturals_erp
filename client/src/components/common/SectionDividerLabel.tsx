import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';

interface SectionDividerLabelProps {
  label: string;
}

const SectionDividerLabel: FC<SectionDividerLabelProps> = ({ label }) => (
  <>
    <Box sx={{ mt: 2, mb: 3, borderBottom: '1px solid #ddd' }} />
    <CustomTypography
      variant="subtitle2"
      sx={{ opacity: 0.6, mb: 1, ml: 1 }}
    >
      {label}
    </CustomTypography>
  </>
);

export default SectionDividerLabel;
