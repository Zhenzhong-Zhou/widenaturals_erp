import { type FC } from 'react';
import { Box } from '@mui/material';
import { ExpiryChip, LowStockChip } from '@features/warehouseInventory/shared';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';

interface InventoryStatusBadgeProps {
  record?: FlattenedWarehouseInventory;
  expiryDate?: string | null;
}

/**
 * Renders the combined alert chips for a single inventory row —
 * low stock and expiry status. Returns null when no alerts apply.
 */
const InventoryStatusBadge: FC<InventoryStatusBadgeProps> = ({
  record,
  expiryDate = null,
}) => {
  if (!record && !expiryDate) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      {record && <LowStockChip available={record.availableQuantity} />}
      <ExpiryChip date={expiryDate} />
    </Box>
  );
};

export default InventoryStatusBadge;
