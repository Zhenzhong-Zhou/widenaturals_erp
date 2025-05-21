import { type FC, memo, useMemo } from 'react';
import CustomMiniTable, { type MiniColumn } from '@components/common/CustomMiniTable';
import type {
  FlatWarehouseInventorySummaryDetailRow,
  WarehouseInventorySummaryItemDetails,
} from '@features/warehouseInventory/state';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import { generateUniqueKey } from '@utils/generateUniqueKey';

interface Props {
  data: WarehouseInventorySummaryItemDetails[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

const WarehouseInventorySummaryDetailTable: FC<Props> = ({
                                                           data,
                                                           page,
                                                           rowsPerPage,
                                                           totalRecords,
                                                           totalPages,
                                                           onPageChange,
                                                           onRowsPerPageChange,
                                                         }) => {
  const id = generateUniqueKey();
  
  const flattenWarehouseInventorySummaryDetailRow = (
    item: WarehouseInventorySummaryItemDetails
  ): FlatWarehouseInventorySummaryDetailRow => ({
    warehouseInventoryId: item.warehouseInventoryId,
    warehouseName: item.warehouse.name,
    itemCode: item.item.code,
    lotNumber: item.lotNumber,
    manufactureDate: item.manufactureDate,
    expiryDate: item.expiryDate,
    warehouseQuantity: item.quantity.warehouseQuantity,
    reserved: item.quantity.reserved,
    available: item.quantity.available,
    statusName: item.status.name,
    statusDate: item.status.date,
    inboundDate: item.timestamps.inboundDate,
    outboundDate: item.timestamps.outboundDate,
    durationInStorage: item.durationInStorage,
    lastUpdate: item.timestamps.lastUpdate,
  });
  
  const warehouseInventoryColumns: MiniColumn<FlatWarehouseInventorySummaryDetailRow>[] = [
    { id: 'warehouseName', label: 'Warehouse' },
    { id: 'itemCode', label: 'Item Code' },
    { id: 'lotNumber', label: 'Lot Number' },
    { id: 'manufactureDate', label: 'MFG Date', format: (v) => formatDate(v) },
    { id: 'expiryDate', label: 'Expiry Date', format: (v) => formatDate(v) },
    { id: 'warehouseQuantity', label: 'WH Qty' },
    { id: 'reserved', label: 'Reserved' },
    { id: 'available', label: 'Available' },
    { id: 'statusName', label: 'Status', format: (v) => formatLabel(v) },
    { id: 'statusDate', label: 'Status Date', format: (v) => formatDate(v) },
    { id: 'inboundDate', label: 'Inbound Date', format: (v) => formatDate(v) },
    { id: 'outboundDate', label: 'Outbound Date', format: (v) => formatDate(v) },
    { id: 'durationInStorage', label: 'Storage (Days)', format: (v) => `${v} days` },
    { id: 'lastUpdate', label: 'Last Updated', format: (v) => formatDate(v) },
  ];
  
  const flattenedData = useMemo(
    () => data.map(flattenWarehouseInventorySummaryDetailRow),
    [data]
  );
  
  return (
    <CustomMiniTable
      rowsPerPageId={`rows-per-page-${id}`}
      columns={warehouseInventoryColumns}
      data={flattenedData}
      page={page}
      initialRowsPerPage={rowsPerPage}
      totalRecords={totalRecords}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyMessage="No warehouse inventory detail available."
    />
  );
};

export default memo(WarehouseInventorySummaryDetailTable);
