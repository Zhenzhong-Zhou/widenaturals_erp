import { type FC, memo } from 'react';
import type { Column } from '@components/common/CustomTable';
import CustomTable from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { WarehouseInventorySummaryItemDetails } from '@features/warehouseInventory/state';
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
  
  const columns: Column<WarehouseInventorySummaryItemDetails>[] = [
    {
      id: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      format: (_, row) => row?.warehouse?.name ?? 'N/A',
    },
    {
      id: 'skuOrMaterial',
      label: 'Item Code',
      sortable: true,
      format: (_, row) => row?.item?.code ?? '—',
    },
    {
      id: 'lotNumber',
      label: 'Lot Number',
      sortable: true,
    },
    {
      id: 'manufactureDate',
      label: 'MFG Date',
      sortable: true,
      format: (_, row) => formatDate(row?.manufactureDate ?? null),
    },
    {
      id: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      format: (_, row) => formatDate(row?.expiryDate ?? null),
    },
    {
      id: 'warehouseQuantity',
      label: 'WH Qty',
      sortable: true,
      format: (_, row) => row?.quantity?.warehouseQuantity ?? 0,
    },
    {
      id: 'reservedQuantity',
      label: 'Reserved',
      sortable: true,
      format: (_, row) => row?.quantity?.reserved ?? 0,
    },
    {
      id: 'availableQuantity',
      label: 'Available',
      sortable: true,
      format: (_, row) => row?.quantity?.available ?? 0,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      format: (_, row) => formatLabel(row?.status?.name ?? 'Unknown'),
    },
    {
      id: 'statusDate',
      label: 'Status Date',
      sortable: true,
      format: (_, row) =>
        row?.status?.date ? formatDate(row?.status?.date) : '-',
    },
    {
      id: 'inboundDate',
      label: 'Inbound Date',
      sortable: true,
      format: (_, row) =>
        row?.timestamps?.inboundDate ? formatDate(row?.timestamps?.inboundDate) : '-',
    },
    {
      id: 'outboundDate',
      label: 'Outbound Date',
      sortable: true,
      format: (_, row) =>
        row?.timestamps?.outboundDate ? formatDate(row?.timestamps?.outboundDate) : '-',
    },
    {
      id: 'durationInStorage',
      label: 'Duration In Storage',
      sortable: true,
      format: (_, row) =>
        row?.timestamps?.durationInStorage ? formatDate(row?.timestamps?.durationInStorage) : '-',
    },
    {
      id: 'lastUpdate',
      label: 'Last Updated',
      sortable: true,
      format: (_, row) =>
        row?.timestamps.lastUpdate ? formatDate(row.timestamps.lastUpdate) : '—'
    },
  ];
  
  return (
    <CustomTable
      rowsPerPageId={`rows-per-page-${id}`}
      columns={columns}
      data={data}
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
