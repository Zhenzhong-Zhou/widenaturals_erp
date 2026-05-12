import { type FC } from 'react';
import { Chip } from '@mui/material';
import CustomMiniTable, {
  type MiniColumn,
} from '@components/common/CustomMiniTable';
import type { WarehouseMovement } from '@features/warehouseInventory/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

type WarehouseInventoryMovementsTableProps = {
  rows: WarehouseMovement[];
};

const columns: MiniColumn<WarehouseMovement>[] = [
  {
    id: 'movementType',
    label: 'Type',
    renderCell: (row) => (
      <Chip size="small" label={row.movementType} variant="outlined" />
    ),
  },
  {
    id: 'fromZoneCode',
    label: 'From',
    format: (value) => (value as string | null) ?? '—',
  },
  {
    id: 'toZoneCode',
    label: 'To',
    format: (value) => (value as string | null) ?? '—',
  },
  {
    id: 'quantity',
    label: 'Qty',
    align: 'right',
    format: (value) => Number(value).toLocaleString(),
  },
  {
    id: 'reference',
    label: 'Reference',
    renderCell: (row) =>
      row.referenceType
        ? `${row.referenceType} · ${row.referenceId ?? '—'}`
        : '—',
  },
  {
    id: 'performedByName',
    label: 'Performed by',
    format: (value) => formatLabel(value as string | null) ?? '—',
  },
  {
    id: 'performedAt',
    label: 'At',
    format: (value) => formatDateTime(value as string | null) ?? '—',
  },
];

const WarehouseInventoryMovementsTable: FC<
  WarehouseInventoryMovementsTableProps
> = ({ rows }) => (
  <CustomMiniTable<WarehouseMovement>
    columns={columns}
    data={rows}
    emptyMessage="No movements recorded for this inventory record."
  />
);

export default WarehouseInventoryMovementsTable;
