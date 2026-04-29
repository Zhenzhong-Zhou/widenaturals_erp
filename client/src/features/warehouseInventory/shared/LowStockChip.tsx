import { type FC } from 'react';
import Chip from '@mui/material/Chip';
import { LOW_STOCK_THRESHOLD } from '@features/warehouseInventory/utils';

interface Props {
  /** Available quantity. Renders chip when at or below LOW_STOCK_THRESHOLD. */
  available: number;
}

const LowStockChip: FC<Props> = ({ available }) => {
  if (available > LOW_STOCK_THRESHOLD) return null;
  
  return (
    <Chip
      label="Low Stock"
      size="small"
      color="warning"
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
};

export default LowStockChip;
