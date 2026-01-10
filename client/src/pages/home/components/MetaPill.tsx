import type { FC } from 'react';
import { Chip, type SxProps, type Theme } from '@mui/material';

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
        borderColor: 'rgba(255,255,255,0.4)',
        color: '#ffffff',
        backgroundColor: 'rgba(47,143,70,0.75)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        ...sx,
      }}
    />
  );
};

export default MetaPill;
