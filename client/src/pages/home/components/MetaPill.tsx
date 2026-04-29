import type { FC } from 'react';
import { Chip, type SxProps, type Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

export interface MetaPillProps {
  label: string;
  sx?: SxProps<Theme>;
}

const MetaPill: FC<MetaPillProps> = ({ label, sx }) => {
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 999,
        borderColor: (t) => alpha(t.palette.primary.main, 0.4),
        color: 'primary.main',
        backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
        '&:hover': {
          backgroundColor: (t) => alpha(t.palette.primary.main, 0.12),
        },
        ...sx,
      }}
    />
  );
};

export default MetaPill;
