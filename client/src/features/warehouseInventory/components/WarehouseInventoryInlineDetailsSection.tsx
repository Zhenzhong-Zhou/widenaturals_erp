import { type FC, lazy, memo, Suspense, useMemo } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { SxProps, Theme } from '@mui/system';
import type { WarehouseInventory } from '@features/warehouseInventory';
import { formatCurrency } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import CustomTypography from '@components/common/CustomTypography';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import IsExpiredChip from '@features/inventory/components/IsExpiredChip';

const LazyDetailsSection = lazy(() => import('@components/common/DetailsSection'));

interface WarehouseInventoryInlineDetailsSectionProps {
  row: WarehouseInventory;
  sx?: SxProps<Theme>;
}

const WarehouseInventoryInlineDetailsSection: FC<WarehouseInventoryInlineDetailsSectionProps> = ({ row, sx }) => {
  const formattedData = useMemo(() => ({
    storageCapacity: row.warehouse.storageCapacity ?? '—',
    location: row.warehouse.location ?? '—',
    reservedQty: row.quantity.reserved ?? '—',
    lotReservedQty: row.quantity.lotReserved ?? '—',
    warehouseFee: formatCurrency(row.fees.warehouseFee) ?? '—',
    earliestManufactureDate: formatDate(row.dates.earliestManufactureDate) ?? '—',
    nearestExpiryDate: formatDate(row.dates.nearestExpiryDate) ?? '—',
  }), [
    row.inventory.itemType,
    row.quantity.reserved,
    row.quantity.lotReserved,
    row.fees.warehouseFee,
    row.dates.earliestManufactureDate,
    row.dates.nearestExpiryDate,
  ]);
  
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      <Suspense
        fallback={
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={140} />
          </Box>
        }
      >
        <LazyDetailsSection data={formattedData} />
      </Suspense>
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mt: 2,
          px: 1,
        }}
      >
        <CustomTypography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Near Expiry:
        </CustomTypography>
         <NearExpiryChip isNearExpiry={row.status.isNearExpiry} />
        
        <CustomTypography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Expired:
        </CustomTypography>
        <IsExpiredChip isExpired={row.status.isExpired} />
      </Box>
    </Box>
  );
};

export default memo(WarehouseInventoryInlineDetailsSection);
