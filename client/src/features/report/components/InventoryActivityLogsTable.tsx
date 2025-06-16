import type { FC } from 'react';
import CustomTable, { type Column } from '@components/common/CustomTable';
import type { InventoryActivityLogEntry } from '@features/report/state';
import { formatDateTime } from '@utils/dateTimeUtils';

interface InventoryActivityLogTableProps {
  data: InventoryActivityLogEntry[];
  loading: boolean;
  page: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const InventoryActivityLogsTable: FC<InventoryActivityLogTableProps> = ({
                                                                         data,
                                                                         loading,
                                                                         page,
                                                                         totalRecords,
                                                                         rowsPerPage,
                                                                         onPageChange,
                                                                         onRowsPerPageChange,
                                                                         selectedRowIds,
                                                                         onSelectionChange,
                                                                       }) => {
  const columns: Column<InventoryActivityLogEntry>[] = [
    {
      id: 'actionTimestamp',
      label: 'Date',
      sortable: true,
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'actionType',
      label: 'Action Type',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
    },
    {
      id: 'performedBy',
      label: 'Performed By',
      sortable: true,
    },
    {
      id: 'quantity',
      label: 'Quantity Change',
      renderCell: (row) => `${row.quantity.change} (${row.quantity.previous} → ${row.quantity.new})`,
    },
    {
      id: 'batchType',
      label: 'Batch Type',
      sortable: true,
    },
    {
      id: 'locationOrWarehouse',
      label: 'Location / Warehouse',
      renderCell: (row) => row.locationName || row.warehouseName,
    },
    {
      id: 'skuOrLot',
      label: 'SKU / Lot',
      renderCell: (row) =>
        row.batchType === 'product'
          ? row.productInfo?.sku ?? '—'
          : row.packagingMaterialInfo?.lotNumber ?? '—',
    },
    {
      id: 'comments',
      label: 'Comments',
      renderCell: (row) => row.comments || '—',
    },
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      loading={loading}
      page={page}
      totalRecords={totalRecords}
      initialRowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      getRowId={(row) => row.id}
      selectedRowIds={selectedRowIds}
      onSelectionChange={onSelectionChange}
      emptyMessage="No inventory activity logs found."
    />
  );
};

export default InventoryActivityLogsTable;
