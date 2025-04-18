import { type FC, lazy, memo, Suspense, useMemo } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import type { SxProps, Theme } from '@mui/system';
import type { WarehouseInventoryDetailExtended } from '@features/warehouseInventory';
import CustomTypography from '@components/common/CustomTypography';
import NearExpiryChip from '@features/inventory/components/NearExpiryChip';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';

const LazyDetailsSection = lazy(() => import('@components/common/DetailsSection'));

interface WarehouseLotDetailsInlineSectionProps {
  row: WarehouseInventoryDetailExtended;
  sx?: SxProps<Theme>;
}

const WarehouseLotDetailsInlineSection: FC<WarehouseLotDetailsInlineSectionProps> = ({ row, sx }) => {
  // Memoize formatted data
  const formattedData = useMemo(() => ({
    itemType: formatLabel(row.itemType),
    reservedStock: row.reservedStock,
    warehouseFees: formatCurrency(row.warehouseFees),
    manufactureDate: formatDate(row.manufactureDate),
    inboundDate: formatDate(row.inboundDate),
    outboundDate: row.outboundDate ? formatDate(row.outboundDate) : 'N/A',
  }), [
    row.itemType,
    row.reservedStock,
    row.warehouseFees,
    row.manufactureDate,
    row.inboundDate,
    row.outboundDate
  ]);
  
  // Memoize chip to avoid re-render
  const expiredChip = useMemo(() => (
    <NearExpiryChip isNearExpiry={row.indicators_isNearExpiry} />
  ), [row.indicators_isNearExpiry]);
  
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: 'background.default',
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
      
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1, px: 1 }}>
        <CustomTypography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Expired:
        </CustomTypography>
        {expiredChip}
      </Box>
    </Box>
  );
};

// Prevent unnecessary re-renders if props are unchanged
export default memo(WarehouseLotDetailsInlineSection);
