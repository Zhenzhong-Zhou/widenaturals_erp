import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { SummaryStat } from '@components/index';
import { formatGeneralStatus } from '@utils/formatters';
import { formatLabel } from '@utils/textUtils';
import type { WarehouseDetailRecord } from '@features/warehouse';

interface Props {
  warehouse: WarehouseDetailRecord | null | undefined;
}

/**
 * Header for the warehouse-scoped inventory page.
 *
 * Displays the warehouse identity (name, status, code, type, city) on the
 * left and summary stats (available, reserved, total, batch count) on the
 * right. Renders gracefully when warehouse data is not yet loaded.
 */
const WarehouseInventoryPageHeader: FC<Props> = ({ warehouse }) => {
  const breadcrumb = [
    warehouse?.code,
    warehouse?.warehouseType?.name && formatLabel(warehouse.warehouseType.name),
    warehouse?.location?.city,
  ]
    .filter(Boolean)
    .join(' · ');
  
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      flexWrap="wrap"
      gap={3}
      mb={3}
    >
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <CustomTypography variant="h5" fontWeight={700}>
            {warehouse?.name ?? '—'}
          </CustomTypography>
          {formatGeneralStatus(warehouse?.status?.name)}
        </Box>
        
        {breadcrumb && (
          <CustomTypography variant="body2" color="text.secondary">
            {breadcrumb}
          </CustomTypography>
        )}
      </Box>
      
      {warehouse?.summary && (
        <Box display="flex" gap={4}>
          <SummaryStat label="Available" value={warehouse.summary.availableQuantity} />
          <SummaryStat label="Reserved"  value={warehouse.summary.totalReserved} />
          <SummaryStat label="Total"     value={warehouse.summary.totalQuantity} />
          <SummaryStat label="Batches"   value={warehouse.summary.totalBatches} />
        </Box>
      )}
    </Box>
  );
};

export default WarehouseInventoryPageHeader;
