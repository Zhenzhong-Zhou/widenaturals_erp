import Chip from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';
import type { StatusColor } from '@utils/getStatusColor';

interface StatusChipProps {
  label: string;
  color?: StatusColor;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const StatusChip = ({
                      label,
                      color = 'default',
                      variant = color === 'default' ? 'outlined' : 'filled',
                      size = 'small',
                      sx,
                    }: StatusChipProps) => {
  const baseSx: SxProps<Theme> = (theme) => ({
    textTransform: 'uppercase',
    fontWeight: 700,
    ...(variant === 'outlined' && {
      borderColor:
        color !== 'default'
          ? theme.palette[color]?.main
          : theme.palette.divider,
      color:
        color !== 'default'
          ? theme.palette[color]?.main
          : theme.palette.text.secondary,
    }),
    ...(variant === 'filled' &&
      color !== 'default' && {
        bgcolor: theme.palette[color]?.light,
        color: theme.palette[color]?.contrastText,
      }),
  });
  
  const mergedSx: SxProps<Theme> = sx
    ? [baseSx, ...(Array.isArray(sx) ? sx : [sx])]
    : baseSx;
  
  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant={variant}
      sx={mergedSx}
    />
  );
};

export default StatusChip;
