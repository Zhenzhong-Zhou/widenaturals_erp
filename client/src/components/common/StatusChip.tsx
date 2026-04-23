import type { FC, ReactElement } from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/material/styles';
import type { StatusColor } from '@utils/getStatusColor';

export interface StatusChipProps {
  /** Display label. Already-formatted — the chip does not transform this further. */
  label: string;
  
  /** Semantic color for the chip. Defaults to 'default' (neutral). */
  color?: StatusColor;
  
  /**
   * Visual variant. When omitted, defaults to 'outlined' for neutral colors
   * and 'filled' for semantic colors.
   */
  variant?: 'filled' | 'outlined';
  
  /** Chip size. Defaults to 'small'. */
  size?: 'small' | 'medium';
  
  /** Optional leading icon. */
  icon?: ReactElement;
  
  /** Optional tooltip shown on hover — useful for explaining non-obvious statuses. */
  tooltip?: string;
  
  /** Additional MUI sx styling, merged with the component's base styles. */
  sx?: SxProps<Theme>;
}

/**
 * Displays a status value as a colored chip with consistent codebase styling:
 * uppercase, bold, and palette-aware.
 *
 * Prefer calling one of the formatter helpers (`formatOrderStatus`,
 * `formatInventoryStatus`, etc.) over instantiating StatusChip directly —
 * those helpers resolve color and label for a given domain.
 *
 * @example
 *   <StatusChip label="Active" color="success" />
 *   <StatusChip label="Pending" color="info" tooltip="Awaiting review" />
 *   <StatusChip label="Archived" color="error" icon={<ArchiveIcon />} />
 */
const StatusChip: FC<StatusChipProps> = ({
                                           label,
                                           color = 'default',
                                           variant,
                                           size = 'small',
                                           icon,
                                           tooltip,
                                           sx,
                                         }) => {
  const resolvedVariant = variant ?? (color === 'default' ? 'outlined' : 'filled');
  
  const baseSx: SxProps<Theme> = (theme) => ({
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: 0.3,
    ...(resolvedVariant === 'outlined' && {
      borderColor:
        color !== 'default'
          ? theme.palette[color]?.main
          : theme.palette.divider,
      color:
        color !== 'default'
          ? theme.palette[color]?.main
          : theme.palette.text.secondary,
    }),
    ...(resolvedVariant === 'filled' &&
      color !== 'default' && {
        bgcolor: theme.palette[color]?.light,
        color: theme.palette[color]?.contrastText,
      }),
  });
  
  const mergedSx: SxProps<Theme> = sx
    ? [baseSx, ...(Array.isArray(sx) ? sx : [sx])]
    : baseSx;
  
  const chip = (
    <Chip
      label={label}
      color={color}
      size={size}
      variant={resolvedVariant}
      icon={icon}
      sx={mergedSx}
    />
  );
  
  return tooltip ? <Tooltip title={tooltip}>{chip}</Tooltip> : chip;
};

export default StatusChip;
