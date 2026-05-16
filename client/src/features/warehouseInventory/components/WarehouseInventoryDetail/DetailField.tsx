import { type FC, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { CustomTypography } from '@components/index';

type DetailFieldProps = {
  label: string;
  value: ReactNode | null | undefined;
};

/**
 * Compact label/value row used inside warehouse inventory detail panels.
 * Renders "—" when value is null or undefined.
 */
const DetailField: FC<DetailFieldProps> = ({ label, value }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 2,
    }}
  >
    <CustomTypography variant="body2" color="text.secondary">
      {label}
    </CustomTypography>
    <CustomTypography variant="body2" sx={{ textAlign: 'right' }}>
      {value ?? '—'}
    </CustomTypography>
  </Box>
);

export default DetailField;
