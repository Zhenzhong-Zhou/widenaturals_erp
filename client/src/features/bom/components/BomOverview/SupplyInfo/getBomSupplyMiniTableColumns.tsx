import type { MiniColumn } from '@components/common/CustomMiniTable';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import { formatDate } from '@utils/dateTimeUtils';
import { formatCurrency } from '@utils/textUtils';
import TruncatedText from '@components/common/TruncatedText';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * Column configuration for the **BOM Item Supply Info Mini Table**.
 *
 * Displays supplier and batch-level details for each BOM item, including:
 *  - Supplier & contract info
 *  - Batch identification and expiry
 *  - Quantity & available stock (from Production Summary)
 *  - Cost details (unit cost, total cost)
 *  - Lead time and status
 *
 *
 * @example
 * <CustomMiniTable
 *   columns={bomSupplyMiniTableColumns}
 *   data={flattenedSupplyRows}
 * />
 */
export const getBomSupplyMiniTableColumns = (
  handleOpenDetails: (row: FlattenedBomSupplyRow) => void
): MiniColumn<FlattenedBomSupplyRow>[] => [
  {
    id: 'packagingMaterialName',
    label: 'Material Name',
    renderCell: (row) => (
      <TruncatedText
        text={row.packagingMaterialName ?? '—'}
        maxLength={15}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },
  {
    id: 'supplierName',
    label: 'Supplier',
    renderCell: (row) => (
      <TruncatedText
        text={row.supplierName ?? '—'}
        maxLength={15}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },
  {
    id: 'materialSnapshotName',
    label: 'Snapshot Name',
    renderCell: (row) => (
      <TruncatedText
        text={row.materialSnapshotName ?? '—'}
        maxLength={15}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },
  {
    id: 'receivedLabelName',
    label: 'Supplier Label',
    renderCell: (row) => (
      <TruncatedText
        text={row.receivedLabelName ?? '—'}
        maxLength={15}
        variant="body2"
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      />
    ),
  },
  // todo: chips or other ui
  {
    id: 'supplierPreferred',
    label: 'Preferred',
    align: 'center',
    renderCell: (row) =>
      row.supplierPreferred ? '✅' : '—',
  },
  {
    id: 'requiredQtyPerProduct',
    label: 'Per Product Qty',
    align: 'center',
    renderCell: (row) =>
      row.requiredQtyPerProduct ?? 1,
  },
  {
    id: 'lotNumber',
    label: 'Lot #',
    renderCell: (row) => row.lotNumber ?? '—',
  },
  {
    id: 'expiryDate',
    label: 'Expiry Date',
    renderCell: (row) => formatDate(row.expiryDate ?? '—'),
  },
  // {
  //   id: 'availableQty',
  //   label: 'Available',
  //   align: 'right',
  //   renderCell: (row) =>
  //     row.availableQty?.toLocaleString() ?? row.quantity?.toLocaleString() ?? '—',
  // },
  {
    id: 'quantity',
    label: 'Batch Qty',
    align: 'right',
    renderCell: (row) => row.quantity ?? '—',
  },
  {
    id: 'batchUnitCost',
    label: 'Unit Cost',
    align: 'right',
    renderCell: (row) =>
      formatCurrency(row.unitCost, row.batchCurrency),
  },
  {
    id: 'totalCost',
    label: 'Total Cost',
    align: 'right',
    renderCell: (row) =>
      formatCurrency(row.totalCost, 'CAD'), // your base currency
  },
  {
    id: 'supplierLeadTimeDays',
    label: 'Lead Time (d)',
    align: 'center',
    renderCell: (row) => row.supplierLeadTimeDays ?? '—',
  },
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
