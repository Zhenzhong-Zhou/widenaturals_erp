import type { FC } from 'react';
import { memo, useMemo } from 'react';
import Chip from '@mui/material/Chip';
import { formatLabel } from '@utils/textUtils.ts';
import { useThemeContext } from '@context/ThemeContext.tsx';

interface Props {
  status: string;
}

const InventoryStatusChip: FC<Props> = ({ status }) => {
  const { theme } = useThemeContext();

  const statusKeys = [
    'in_stock',
    'out_of_stock',
    'suspended',
    'unassigned',
  ] as const;
  type StatusKey = (typeof statusKeys)[number];

  const safeStatus = useMemo<StatusKey>(() => {
    return statusKeys.includes(status as StatusKey)
      ? (status as StatusKey)
      : 'unassigned';
  }, [status]);

  const statusColor = useMemo(() => {
    const map: Record<StatusKey, string> = {
      in_stock: theme.palette.success.main,
      out_of_stock: theme.palette.error.main,
      suspended: theme.palette.warning.main,
      unassigned: theme.palette.text.disabled,
    };
    return map[safeStatus];
  }, [safeStatus, theme]);

  return (
    <Chip
      label={formatLabel(status)}
      sx={{
        border: `1px solid ${statusColor}`,
        color: statusColor,
        fontWeight: 500,
      }}
      size="small"
      variant="outlined"
    />
  );
};

export default memo(InventoryStatusChip);
