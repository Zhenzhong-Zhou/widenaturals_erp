import { type FC } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** Units at or below this value are considered low stock. */
export const LOW_STOCK_THRESHOLD = 10;

/** Days until expiry at or below this value are considered expiring soon. */
export const EXPIRING_SOON_DAYS = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const isLowStock = (record: FlattenedWarehouseInventory): boolean =>
  record.availableQuantity <= LOW_STOCK_THRESHOLD;

/**
 * Returns true if the record is expiring within EXPIRING_SOON_DAYS.
 * Requires expiryDate to be present on the record — not currently in the
 * flattened inventory type. Add expiryDate to the warehouse inventory query
 * and FlattenedWarehouseInventory before enabling this.
 */
export const isExpiringSoon = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false;
  const daysUntil = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return daysUntil <= EXPIRING_SOON_DAYS && daysUntil >= 0;
};

export const isExpired = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

// ─── Badge Component ──────────────────────────────────────────────────────────

interface InventoryStatusBadgeProps {
  record?: FlattenedWarehouseInventory;
  /** Pass expiryDate once added to FlattenedWarehouseInventory. */
  expiryDate?: string | null;
}

/**
 * Renders low stock and expiring/expired status badges for an inventory row.
 * Multiple badges can appear on the same row if both conditions are true.
 */
const InventoryStatusBadge: FC<InventoryStatusBadgeProps> = ({
                                                               record,
                                                               expiryDate = null,
                                                             }) => {
  const lowStock     = record ? isLowStock(record) : false;
  const expiringSoon = isExpiringSoon(expiryDate);
  const expired     = isExpired(expiryDate);
  
  if (!lowStock && !expiringSoon && !expired) return null;
  
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {lowStock && (
        <Chip
          label="Low Stock"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      )}
      {expired && (
        <Chip
          label="Expired"
          size="small"
          color="error"
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      )}
      {!expired && expiringSoon && (
        <Chip
          label="Expiring Soon"
          size="small"
          color="warning"
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      )}
    </Box>
  );
};

export default InventoryStatusBadge;
