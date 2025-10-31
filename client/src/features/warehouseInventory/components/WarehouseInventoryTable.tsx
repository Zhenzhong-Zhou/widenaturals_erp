import type { FC } from 'react';
import BaseInventoryTable from '@features/inventoryShared/components/BaseInventoryTable';
import type { WarehouseInventoryTableProps } from '../state';
import { formatLabel } from '@utils/textUtils';
import { formatDate, timeAgo } from '@utils/dateTimeUtils';

const WarehouseInventoryTable: FC<WarehouseInventoryTableProps> = (props) => {
  return (
    <BaseInventoryTable
      {...props}
      groupKey="warehouse"
      getGroupHeaderId={(name) => `group-${name}`}
      getRowData={(item) => ({
        id: item.id,
        type: item.lot?.batchType,
        name: item.display.name,
        lotNumber: item.lot?.number ?? '-',
        expiryDate: item.lot?.expiryDate
          ? formatDate(item.lot.expiryDate)
          : '-',
        warehouseQuantity: item.quantity.warehouseQuantity ?? 0,
        available: item.quantity.available ?? 0,
        reserved: item.quantity.reserved ?? 0,
        lastUpdate: item.timestamps?.lastUpdate
          ? timeAgo(item.timestamps.lastUpdate)
          : '-',
        status: formatLabel(item.status?.name) ?? '-',
        statusDate: item.timestamps?.statusDate
          ? formatDate(item.timestamps.statusDate)
          : '-',
        stockLevel: item.status?.stockLevel ?? '-',
        expirySeverity: item.status?.expirySeverity ?? '-',
        originalRecord: item,
      })}
    />
  );
};

export default WarehouseInventoryTable;
