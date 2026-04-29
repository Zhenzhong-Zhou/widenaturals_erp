import { type FC } from 'react';
import Chip from '@mui/material/Chip';
import { isExpired, isExpiringSoon } from '@features/warehouseInventory/utils/inventoryStatus';

interface Props {
  date: string | null | undefined;
}

const ExpiryChip: FC<Props> = ({ date }) => {
  if (!date) return null;
  if (isExpired(date)) {
    return (
      <Chip
        label="Expired"
        size="small"
        color="error"
        variant="filled"
        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
      />
    );
  }
  if (isExpiringSoon(date)) {
    return (
      <Chip
        label="Expiring Soon"
        size="small"
        color="warning"
        variant="filled"
        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
      />
    );
  }
  return null;
};

export default ExpiryChip;
