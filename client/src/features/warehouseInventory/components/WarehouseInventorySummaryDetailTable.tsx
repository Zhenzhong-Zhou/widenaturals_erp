import { type FC } from 'react';
import type { Column } from '@components/common/CustomTable';
import CustomTable from '@components/common/CustomTable';
import { formatDate } from '@utils/dateTimeUtils';
import type { WarehouseInventorySummaryItemDetails } from '@features/warehouseInventory/state';

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
  console.log(data)
  const columns: Column<WarehouseInventorySummaryItemDetails>[] = [
    {
      id: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      format: (_, row) => row?.warehouse?.name ?? 'N/A',
    },
    {
      id: 'sku',
      label: 'SKU',
      sortable: true,
      format: (_, row) => row?.sku?.code,
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
      format: (_, row) => row?.status?.id ?? 'Unknown',
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (_, row) =>
        row?.status?.date ? formatDate(row?.status?.date) : '-',
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

export default WarehouseInventorySummaryDetailTable;
