import { type FC } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {
  CustomTypography,
  SummaryStat,
  TruncatedText,
} from '@components/index';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import {
  ChipSlot,
  ExpiryChip,
  LowStockChip,
} from '@features/warehouseInventory/shared';
import type { WarehousePackagingSummary } from '@features/warehouseInventory';

interface Props {
  material: WarehousePackagingSummary;
}

/**
 * Flat card for a single packaging material's warehouse summary.
 * No SKU breakdown — packaging materials roll up directly.
 */
const WarehousePackagingSummaryCard: FC<Props> = ({ material }) => {
  return (
    <Card variant="outlined" sx={{ p: 2, mb: 1, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Box flex={1} minWidth={200}>
          <Box display="flex" alignItems="center" gap={1}>
            <TruncatedText
              text={material.packagingMaterialName ?? '(unnamed material)'}
              maxLength={40}
              variant="subtitle1"
              fontWeight={700}
            />
            {material.packagingMaterialCategory && (
              <Chip
                label={formatLabel(material.packagingMaterialCategory)}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <CustomTypography variant="caption" color="text.secondary">
            {material.packagingMaterialCode} · {material.batchCount} batch
            {material.batchCount === 1 ? '' : 'es'}
          </CustomTypography>
        </Box>

        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          <SummaryStat
            label="Total"
            value={material.totalQuantity}
            minWidth={80}
          />
          <SummaryStat
            label="Reserved"
            value={material.totalReserved}
            minWidth={80}
          />
          <Box display="flex" alignItems="center" gap={1}>
            <SummaryStat
              label="Available"
              value={material.totalAvailable}
              minWidth={80}
            />
            <ChipSlot>
              <LowStockChip available={material.totalAvailable} />
            </ChipSlot>
          </Box>
          <Box display="flex" alignItems="center" gap={1} minWidth={140}>
            <Box>
              <CustomTypography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Earliest Expiry
              </CustomTypography>
              <CustomTypography variant="body2" fontWeight={600}>
                {material.earliestExpiry
                  ? formatDate(material.earliestExpiry)
                  : '—'}
              </CustomTypography>
            </Box>
            <ChipSlot>
              <ExpiryChip date={material.earliestExpiry} />
            </ChipSlot>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

export default WarehousePackagingSummaryCard;
