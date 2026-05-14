import { type FC } from 'react';
import { CustomTypography } from '@components/index';
import CustomMiniTable, {
  type MiniColumn,
} from '@components/common/CustomMiniTable';
import type { WarehouseZone } from '@features/warehouseInventory/state';
import { formatDate } from '@utils/dateTimeUtils';

type WarehouseInventoryZonesTableProps = {
  rows: WarehouseZone[];
};

const columns: MiniColumn<WarehouseZone>[] = [
  {
    id: 'zoneCode',
    label: 'Zone',
    renderCell: (row) => (
      <CustomTypography fontWeight={500}>{row.zoneCode}</CustomTypography>
    ),
  },
  {
    id: 'quantity',
    label: 'Quantity',
    align: 'right',
    format: (value) => Number(value).toLocaleString(),
  },
  {
    id: 'reservedQuantity',
    label: 'Reserved',
    align: 'right',
    format: (value) => Number(value).toLocaleString(),
  },
  {
    id: 'availableQuantity',
    label: 'Available',
    align: 'right',
    format: (value) => Number(value).toLocaleString(),
  },
  {
    id: 'zoneEntryDate',
    label: 'Entry',
    format: (value) => formatDate(value as string | null) ?? '—',
  },
  {
    id: 'zoneExitDate',
    label: 'Exit',
    format: (value) => formatDate(value as string | null) ?? '—',
  },
];

const WarehouseInventoryZonesTable: FC<WarehouseInventoryZonesTableProps> = ({
  rows,
}) => (
  <CustomMiniTable<WarehouseZone>
    columns={columns}
    data={rows}
    emptyMessage="No zone breakdown for this inventory record."
  />
);

export default WarehouseInventoryZonesTable;
