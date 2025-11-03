import Chip from '@mui/material/Chip';
import type { StatusColor } from '@utils/getStatusColor';

interface StatusChipProps {
  label: string;
  color?: StatusColor;
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
      sx={(theme) => ({
        textTransform: 'uppercase',
        fontWeight: 600,
        bgcolor:
          color && color !== 'default'
            ? (theme.palette[color]?.light ?? undefined)
            : undefined,
      })}
    />
  );
};

export default StatusChip;
