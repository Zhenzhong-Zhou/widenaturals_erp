import { type FC } from 'react';
import {
  Box,
  Card,
  Chip,
  Stack
} from '@mui/material';
import {
  CustomTypography,
  SummaryStat,
  TruncatedText,
} from '@components/index';
import {
  ChipSlot,
  ExpiryChip,
  LowStockChip,
} from '@features/warehouseInventory/shared';
import type { WarehousePackagingSummary } from '@features/warehouseInventory';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 200,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TruncatedText
              text={material.packagingMaterialName ?? '(unnamed material)'}
              maxLength={40}
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
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
        
        <Stack
          direction="row"
          spacing={3}
          useFlexGap
          sx={{
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
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
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SummaryStat
              label="Available"
              value={material.totalAvailable}
              minWidth={80}
            />
            
            <ChipSlot>
              <LowStockChip available={material.totalAvailable} />
            </ChipSlot>
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 140,
            }}
          >
            <Box>
              <CustomTypography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Earliest Expiry
              </CustomTypography>
              
              <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
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
