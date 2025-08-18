import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';

type ChipColor = ChipProps['color'];

interface StatusChipProps {
  label: string;
  color?: ChipColor;
  variant?: 'filled' | 'outlined';
}

const StatusChip = ({
                      label,
                      color = 'default',
                      variant = color === 'default' ? 'outlined' : 'filled',
                    }: StatusChipProps) => {
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant={variant}
      sx={{ textTransform: 'uppercase', fontWeight: 600 }}
    />
  );
};

export default StatusChip;
