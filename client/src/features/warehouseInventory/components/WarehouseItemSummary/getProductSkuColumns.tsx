import { Box } from '@mui/material';
import type { MiniColumn } from '@components/common/CustomMiniTable';
import { formatDate } from '@utils/dateTimeUtils';
import { ExpiryChip, LowStockChip } from '@features/warehouseInventory/shared';
import type { WarehouseProductSkuSummary } from '@features/warehouseInventory';

/**
 * Column definitions for the per-SKU breakdown table inside
 * WarehouseProductSummaryCard's expanded accordion.
 *
 * Defined as a function (not a const) for consistency with other
 * column builders in the codebase and to allow future parameterisation
 * (e.g. permission-gated columns) without a signature change.
 */
export const getProductSkuColumns =
  (): MiniColumn<WarehouseProductSkuSummary>[] => [
    {
      id: 'sku',
      label: 'SKU',
      renderCell: (row) => row.sku,
    },
    {
      id: 'sizeLabel',
      label: 'Size',
      renderCell: (row) => row.sizeLabel ?? '—',
    },
    {
      id: 'region',
      label: 'Region',
      renderCell: (row) => row.marketRegion ?? row.countryCode ?? '—',
    },
    {
      id: 'totalQuantity',
      label: 'Total',
      align: 'right',
      renderCell: (row) => row.totalQuantity,
    },
    {
      id: 'totalReserved',
      label: 'Reserved',
      align: 'right',
      renderCell: (row) => row.totalReserved,
    },
    {
      id: 'totalAvailable',
      label: 'Available',
      align: 'right',
      renderCell: (row) => (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          {row.totalAvailable}
          <LowStockChip available={row.totalAvailable} />
        </Box>
      ),
    },
    {
      id: 'batchCount',
      label: 'Batches',
      align: 'right',
      renderCell: (row) => row.batchCount,
    },
    {
      id: 'earliestExpiry',
      label: 'Earliest Expiry',
      renderCell: (row) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <span>
            {row.earliestExpiry ? formatDate(row.earliestExpiry) : '—'}
          </span>
          <ExpiryChip date={row.earliestExpiry} />
        </Box>
      ),
    },
  ];
