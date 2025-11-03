import type { MiniColumn } from '@components/common/CustomMiniTable';
import type { UnifiedBatchRow } from '@features/bom/state';
import { formatDate, formatToISODate } from '@utils/dateTimeUtils';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import TruncatedText from '@components/common/TruncatedText';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Chip from '@mui/material/Chip';

/**
 * Columns for the **Unified BOM Batch Mini Table**.
 *
 * Combines supplier, batch, and inventory readiness info:
 *  - Supplier & material identification
 *  - Lot number and inbound/expiry dates
 *  - Warehouse and stock quantities
 *  - Cost & currency info (when applicable)
 *  - Readiness indicators (bottleneck / shortage)
 */
export const getBomSupplyMiniTableColumns = (
  handleOpenDetails: (row: UnifiedBatchRow) => void
): MiniColumn<UnifiedBatchRow>[] => [
  // Material Name
  {
    id: 'packagingMaterialName',
    label: 'Material Name',
    renderCell: (row) => (
      <TruncatedText
        text={row.packagingMaterialName ?? row.partName ?? '—'}
        maxLength={10}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },

  // Lot number
  {
    id: 'lotNumber',
    label: 'Lot #',
    renderCell: (row) => row.lotNumber ?? '—',
  },

  // Supplier (if available)
  {
    id: 'supplierName',
    label: 'Supplier',
    renderCell: (row) => (
      <TruncatedText
        text={row.supplierName ?? '—'}
        maxLength={10}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },

  // Warehouse (readiness / inventory side)
  {
    id: 'warehouseName',
    label: 'Warehouse',
    renderCell: (row) => (
      <TruncatedText
        text={row.warehouseName ?? '—'}
        maxLength={10}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },

  // Inbound / Manufacture Date
  {
    id: 'MFGDate',
    label: 'MFG Date',
    align: 'center',
    renderCell: (row) =>
      formatToISODate(row.sourceSupply?.manufactureDate ?? '—'),
  },

  // Expiry Date
  {
    id: 'expiryDate',
    label: 'Expiry',
    align: 'center',
    renderCell: (row) => formatDate(row.sourceSupply?.expiryDate ?? '—'),
  },

  {
    id: 'supplierPreferred',
    label: 'Preferred',
    align: 'center',
    renderCell: (row) => (row.sourceSupply?.supplierPreferred ? '✅' : '—'),
  },

  // // Inventory Status Chip
  {
    id: 'inventoryStatus',
    label: 'Status',
    align: 'center',
    renderCell: (row) => (
      <Chip
        size="small"
        label={formatLabel(row.inventoryStatus ?? '—')}
        color={
          row.inventoryStatus === 'in_stock'
            ? 'success'
            : row.inventoryStatus === 'reserved'
              ? 'warning'
              : 'default'
        }
        variant="outlined"
      />
    ),
  },

  // Quantities
  {
    id: 'batchQuantity',
    label: 'Batch Qty',
    align: 'right',
    renderCell: (row) => row.sourceSupply?.quantity ?? '—',
  },
  {
    id: 'availableQuantity',
    label: 'Available',
    align: 'right',
    renderCell: (row) => row.availableQuantity ?? '—',
  },
  {
    id: 'reservedQuantity',
    label: 'Reserved',
    align: 'right',
    renderCell: (row) => (row.reservedQuantity ? row.reservedQuantity : '—'),
  },

  // Cost (supply side only)
  {
    id: 'unitCost',
    label: 'Unit Cost',
    align: 'right',
    renderCell: (row) =>
      row.unitCost ? formatCurrency(row.unitCost, row.currency ?? 'CAD') : '—',
  },
  {
    id: 'totalCost',
    label: 'Total Cost',
    align: 'right',
    renderCell: (row) =>
      row.sourceSupply?.totalCost
        ? formatCurrency(row.sourceSupply?.totalCost, row.currency ?? 'CAD')
        : '—',
  },

  // Bottleneck / Shortage
  {
    id: 'readinessFlags',
    label: 'Health',
    align: 'center',
    renderCell: (row) => {
      if (row.isShortage)
        return <Chip size="small" color="error" label="Shortage" />;
      if (row.isBottleneck)
        return <Chip size="small" color="warning" label="Bottleneck" />;
      return <Chip size="small" color="success" label="OK" />;
    },
  },

  // Actions
  {
    id: 'actions',
    label: '',
    align: 'center',
    renderCell: (row) => (
      <IconButton
        size="small"
        onClick={() => handleOpenDetails(row)}
        title="View Details"
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    ),
  },
];
