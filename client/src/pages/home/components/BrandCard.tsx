import type { FC } from 'react';
import { Paper } from '@mui/material';
import { CustomTypography } from '@components/index';

export interface BrandCardProps {
  title: string;
  body: string;
}

const BrandCard: FC<BrandCardProps> = ({ title, body }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 2.25,
        backgroundColor: 'background.paper',
        boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
      }}
    >
      <CustomTypography variant="subtitle2" fontWeight={800}>
        {title}
      </CustomTypography>

      <CustomTypography
        variant="body2"
        sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.6 }}
      >
        {body}
      </CustomTypography>

      <CustomTypography
        variant="caption"
        sx={{ mt: 1.5, display: 'block', color: 'text.disabled' }}
      >
        Available for distribution and partnership discussions.
      </CustomTypography>
    </Paper>
  );
};

export default BrandCard;
