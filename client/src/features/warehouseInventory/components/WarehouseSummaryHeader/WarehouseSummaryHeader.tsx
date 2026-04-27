import type { FC } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import { SummaryStat } from '@components/index';
import StatusChip from '@components/common/StatusChip';
import { formatGeneralStatus } from '@utils/formatters';
import { formatLabel } from '@utils/textUtils';
import type {
  WarehouseSummaryByBatchType,
  WarehouseSummaryByStatus,
  WarehouseSummaryInfo,
  WarehouseSummaryTotals,
} from '@features/warehouseInventory';


interface Props {
  warehouseInfo: WarehouseSummaryInfo | null | undefined;
  totals: WarehouseSummaryTotals | null | undefined;
  byBatchType: WarehouseSummaryByBatchType | null | undefined;
  byStatus: WarehouseSummaryByStatus[] | null | undefined;
}

/**
 * Header for the warehouse-scoped inventory page.
 *
 * Renders identity (name, code, type, status), totals (available, reserved,
 * total, batch and SKU counts), and a status breakdown row when present.
 * Renders gracefully when summary data is not yet loaded.
 */
const WarehouseSummaryHeader: FC<Props> = ({
                                                   warehouseInfo,
                                                   totals,
                                                   byBatchType,
                                                   byStatus,
                                                 }) => {
  const breadcrumb = [
    warehouseInfo?.code,
    warehouseInfo?.typeName && formatLabel(warehouseInfo.typeName),
  ]
    .filter(Boolean)
    .join(' · ');
  
  return (
    <Box mb={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={3}
        mb={2}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <CustomTypography variant="h5" fontWeight={700}>
              {warehouseInfo?.name ?? '—'}
            </CustomTypography>
            {formatGeneralStatus(warehouseInfo?.status?.name)}
          </Box>
          
          {breadcrumb && (
            <CustomTypography variant="body2" color="text.secondary">
              {breadcrumb}
            </CustomTypography>
          )}
          
          {byBatchType && (
            <CustomTypography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {byBatchType.product.batchCount} product ·{' '}
              {byBatchType.packagingMaterial.batchCount} packaging
            </CustomTypography>
          )}
        </Box>
        
        {totals && (
          <Box display="flex" gap={4} flexWrap="wrap">
            <SummaryStat label="Available" value={totals.available} />
            <SummaryStat label="Reserved"  value={totals.reserved} />
            <SummaryStat label="Total"     value={totals.quantity} />
            <SummaryStat label="Batches"   value={totals.batches} />
            <SummaryStat label="SKUs"      value={totals.productSkus} />
          </Box>
        )}
      </Box>
      
      {byStatus && byStatus.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {byStatus.map((s) => (
            <StatusChip
              key={s.statusId}
              label={`${formatLabel(s.statusName)} · ${s.batchCount}`}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default WarehouseSummaryHeader;
