import { FC } from 'react';
import CustomTable from '@components/common/CustomTable.tsx';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { Column } from '@components/common/CustomTable.tsx';
import { InventoryHistoryParams } from '../state/reportTypes.ts';

interface InventoryHistoryTableProps {
  data: any[];
  pagination: {
    totalPages: number;
    totalRecords: number;
  };
  filters: any;
  setFilters: (filters: any) => void;
  fetchInventoryHistory: (params: any) => void;
}

const InventoryHistoryTable: FC<InventoryHistoryTableProps> = ({
  data,
  pagination,
  filters,
  setFilters,
  fetchInventoryHistory,
}) => {
  const columns: Column[] = [
    {
      id: 'item_name',
      label: 'Item Name',
      sortable: true,
    },
    {
      id: 'action_type',
      label: 'Action Type',
      sortable: true,
      format: (value) => capitalizeFirstLetter(value),
    },
    {
      id: 'previous_quantity',
      label: 'Previous Quantity',
      sortable: true,
    },
    {
      id: 'quantity_change',
      label: 'Change',
      sortable: true,
    },
    {
      id: 'new_quantity',
      label: 'New Quantity',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value) => capitalizeFirstLetter(value),
    },
    {
      id: 'status_date',
      label: 'Status Date',
      sortable: true,
      format: (value) => formatDateTime(value),
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
      format: (value) => formatDateTime(value),
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: true,
      format: (value) => value,
    },
    {
      id: 'source_user',
      label: 'Action By',
      sortable: true,
    },
    {
      id: 'adjusted_timestamp',
      label: 'Timestamp',
      sortable: true,
      format: (value) => formatDate(value),
    },
    {
      id: 'comments',
      label: 'Comments',
      sortable: false,
    },
    {
      id: 'metadata',
      label: 'Metadata',
      sortable: false,
      format: (value) =>
        value
          ? Object.entries(value)
              .map(([key, val]) => `${key}: ${val}`)
              .join(', ')
          : 'N/A',
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      rowsPerPageOptions={[10, 25, 50, 75]}
      initialRowsPerPage={filters.limit}
      totalPages={pagination.totalPages}
      totalRecords={pagination.totalRecords}
      page={filters.page ?? 1}
      onPageChange={(newPage) => {
        setFilters((prev: InventoryHistoryParams) => ({
          ...prev,
          page: newPage,
        }));
        fetchInventoryHistory({ ...filters, page: newPage });
      }}
      onRowsPerPageChange={(newLimit) => {
        setFilters((prev: InventoryHistoryParams) => ({
          ...prev,
          limit: newLimit,
          page: 1,
        })); // Reset to first page
        fetchInventoryHistory({ ...filters, limit: newLimit, page: 1 });
      }}
    />
  );
};

export default InventoryHistoryTable;
