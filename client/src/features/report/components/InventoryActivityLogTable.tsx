import { FC } from 'react';
import {
  InventoryActivityLog,
  InventoryActivityLogParams,
} from '../state/reportTypes.ts';
import { Column } from '@components/common/CustomTable';
import { CustomTable } from '@components/index.ts';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils.ts';
import { formatLabel } from '@utils/textUtils.ts';

interface InventoryLogTableProps {
  data: any[];
  pagination: {
    totalPages: number;
    totalRecords: number;
  };
  filters: any;
  setFilters: (filters: any) => void;
  fetchInventoryActivityLogs: (params: any) => void;
}

/**
 * Component to display inventory activity logs with sorting and pagination.
 */
const InventoryActivityLogTable: FC<InventoryLogTableProps> = ({
  data,
  pagination,
  filters,
  setFilters,
  fetchInventoryActivityLogs,
}) => {
  const columns: Column<InventoryActivityLog>[] = [
    {
      id: 'order_number',
      label: 'Order Number',
      sortable: true,
      format: (
        value: string | number | Record<string, any> | null,
      ): string | number | null | undefined => {
        if (typeof value === 'string' || typeof value === 'number') {
          return value;
        }
        return '-';
      }
    },
    {
      id: 'warehouse_name',
      label: 'Warehouse',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'item_name',
      label: 'Item Name',
      minWidth: 150,
      sortable: true,
    },
    {
      id: 'lot_number',
      label: 'Lot Number',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'expiry_date',
      label: 'Expiry Date',
      minWidth: 120,
      sortable: true,
      format: (value: string | number | Record<string, any> | null) =>
        typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date
          ? formatDate(value)
          : 'N/A',
    },
    {
      id: 'manufacture_date',
      label: 'Manufacture Date',
      minWidth: 120,
      sortable: true,
      format: (value: string | number | Record<string, any> | null) =>
        typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date
          ? formatDate(value)
          : 'N/A',
    },
    {
      id: 'action_type',
      label: 'Action Type',
      minWidth: 120,
      sortable: true,
      format: (value: string | number | Record<string, any> | null) =>
        typeof value === 'string' ? formatLabel(value) : 'N/A',
    },
    {
      id: 'quantity_change',
      label: 'Quantity Change',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'previous_quantity',
      label: 'Previous Qty',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'new_quantity',
      label: 'New Qty',
      minWidth: 100,
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      sortable: true,
      format: (value: string | number | Record<string, any> | null) =>
        typeof value === 'string' ? formatLabel(value) : 'N/A',
    },
    {
      id: 'adjustment_type',
      label: 'Adjustment Type',
      minWidth: 120,
      sortable: true,
      format: (value: string | number | Record<string, any> | null) =>
        typeof value === 'string' ? formatLabel(value) : 'N/A',
    },
    {
      id: 'user_name',
      label: 'User',
      minWidth: 120,
      sortable: true,
    },
    {
      id: 'local_timestamp',
      label: 'Modified Date',
      minWidth: 150,
      sortable: true,
      format: (value: string | number | Record<string, any> | null) =>
        typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date
          ? formatDateTime(value)
          : 'N/A',
    },
    {
      id: 'comments',
      label: 'Comments',
      minWidth: 200,
      sortable: false,
      format: (value: string | number | Record<string, any> | null) => {
        if (typeof value === 'string' || typeof value === 'number') {
          return value;
        }
        return 'N/A';
      },
    },
    {
      id: 'metadata',
      label: 'Metadata',
      minWidth: 200,
      sortable: false,
      format: (value: string | number | Record<string, any> | null) => {
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return 'N/A';
      },
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={filters.page ?? 1}
      totalPages={pagination.totalPages}
      totalRecords={pagination.totalRecords}
      onPageChange={(newPage) => {
        setFilters((prev: InventoryActivityLogParams) => ({
          ...prev,
          page: newPage,
        }));
        fetchInventoryActivityLogs({ ...filters, page: newPage });
      }}
      onRowsPerPageChange={(newLimit) => {
        setFilters((prev: InventoryActivityLogParams) => ({
          ...prev,
          limit: newLimit,
          page: 1,
        })); // Reset to first page
        fetchInventoryActivityLogs({ ...filters, limit: newLimit, page: 1 });
      }}
      initialRowsPerPage={filters.limit}
      rowsPerPageOptions={[10, 25, 50, 75]}
    />
  );
};

export default InventoryActivityLogTable;
