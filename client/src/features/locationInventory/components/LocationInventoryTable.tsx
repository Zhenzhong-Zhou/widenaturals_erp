import { type FC } from 'react';
import BaseInventoryTable from '@features/inventoryShared/components/BaseInventoryTable';
import { formatLabel } from '@utils/textUtils';
import { formatDate, timeAgo } from '@utils/dateTimeUtils';
import type { LocationInventoryTableProps } from '../state';

const LocationInventoryTable: FC<LocationInventoryTableProps> = (props) => {
  return (
    <BaseInventoryTable
      {...props}
      groupKey="location"
      getGroupHeaderId={(name) => `group-${name}`}
      getRowData={(item) => ({
        id: item.id,
        name: item.display.name,
        lotNumber: item.lot?.number ?? '-',
        expiryDate: item.lot?.expiryDate
          ? formatDate(item.lot.expiryDate)
          : '-',
        locationQuantity: item.quantity.locationQuantity ?? 0,
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

export default LocationInventoryTable;
