import { FC } from 'react';
import { Chip } from '@mui/material';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { useThemeContext } from '../../../context/ThemeContext.tsx';

interface Props {
  status: string;
}

const InventoryStatusChip: FC<Props> = ({ status }) => {
  const { theme } = useThemeContext();
  
  const statusKeys = ['in_stock', 'out_of_stock', 'suspended', 'unassigned'] as const;
  type StatusKey = typeof statusKeys[number];
  
  const customColorMap: Record<StatusKey, string> = {
    in_stock: theme.palette.success.main,
    out_of_stock: theme.palette.error.main,
    suspended: theme.palette.warning.main,
    unassigned: theme.palette.text.disabled,
  };
  
  const safeStatus = statusKeys.includes(status as StatusKey)
    ? (status as StatusKey)
    : 'unassigned';
  
  return (
    <Chip
      label={capitalizeFirstLetter(status.replace(/_/g, ' '))}
      sx={{
        border: `1px solid ${customColorMap[safeStatus]}`,
        color: customColorMap[safeStatus],
        fontWeight: 500,
      }}
      size="small"
      variant="outlined"
    />
  );
};

export default InventoryStatusChip;
