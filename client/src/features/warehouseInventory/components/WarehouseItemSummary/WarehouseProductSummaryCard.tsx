import { type FC, useMemo, useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  CustomTypography,
  CustomMiniTable,
  SummaryStat,
  TruncatedText,
} from '@components/index';
import { formatDate } from '@utils/dateTimeUtils';
import {
  ChipSlot,
  ExpiryChip,
  LowStockChip,
} from '@features/warehouseInventory/shared';
import type { WarehouseProductSummary } from '@features/warehouseInventory';
import { getProductSkuColumns } from '@features/warehouseInventory/components/WarehouseItemSummary/getProductSkuColumns';

interface Props {
  product: WarehouseProductSummary;
}

/**
 * Expandable card for a single product's warehouse summary.
 * Collapsed: brand, name, totals, batch count, earliest expiry.
 * Expanded: per-SKU breakdown table.
 */
const WarehouseProductSummaryCard: FC<Props> = ({ product }) => {
  const [expanded, setExpanded] = useState(false);

  const columns = useMemo(() => getProductSkuColumns(), []);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((v) => !v)}
      disableGutters
      sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          width="100%"
        >
          <Box flex={1} minWidth={200}>
            <Box display="flex" alignItems="center" gap={1}>
              <TruncatedText
                text={product.productName ?? '(unnamed product)'}
                maxLength={40}
                variant="subtitle1"
                fontWeight={700}
              />
              {product.brand && (
                <Chip label={product.brand} size="small" variant="outlined" />
              )}
            </Box>
            <CustomTypography variant="caption" color="text.secondary">
              {product.skus.length} SKU{product.skus.length === 1 ? '' : 's'} ·{' '}
              {product.batchCount} batch{product.batchCount === 1 ? '' : 'es'}
            </CustomTypography>
          </Box>

          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            flexWrap="wrap"
          >
            <SummaryStat
              label="Total"
              value={product.totalQuantity}
              minWidth={80}
            />
            <SummaryStat
              label="Reserved"
              value={product.totalReserved}
              minWidth={80}
            />
            <Box display="flex" alignItems="center" gap={1}>
              <SummaryStat
                label="Available"
                value={product.totalAvailable}
                minWidth={80}
              />
              <ChipSlot>
                <LowStockChip available={product.totalAvailable} />
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
                  {product.earliestExpiry
                    ? formatDate(product.earliestExpiry)
                    : '—'}
                </CustomTypography>
              </Box>
              <ChipSlot>
                <ExpiryChip date={product.earliestExpiry} />
              </ChipSlot>
            </Box>
          </Stack>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <CustomMiniTable
          columns={columns}
          data={product.skus}
          emptyMessage="No SKUs available"
          dense
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default WarehouseProductSummaryCard;
