import type { FC } from 'react';
import CustomTable from '@components/common/CustomTable';
import type { Column } from '@components/common/CustomTable';
import type { AdjustmentReportParams } from '@features/report';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

interface AdjustmentReportTableProps {
  data: any[];
  pagination: {
    totalPages: number;
    totalRecords: number;
  };
  filters: any;
  setFilters: (filters: any) => void;
  fetchReport: (params: any) => void;
}

const AdjustmentReportTable: FC<AdjustmentReportTableProps> = ({
  data,
  pagination,
  filters,
  setFilters,
  fetchReport,
}) => {
  const columns: Column[] = [
    {
      id: 'warehouse_name',
      label: 'Warehouse Name',
      sortable: true,
    },
    {
      id: 'order_number',
      label: 'Order Number',
      sortable: true,
    },
    {
      id: 'item_name',
      label: 'Item Name',
      sortable: true,
    },
    {
      id: 'lot_number',
      label: 'Lot Number',
      sortable: true,
    },
    {
      id: 'expiry_date',
      label: 'Expiry Date',
      sortable: true,
      format: (value) => formatDate(value),
    },
    {
      id: 'manufacture_date',
      label: 'Manufacture Date',
      sortable: true,
      format: (value) => formatDate(value),
    },
    {
      id: 'adjustment_type',
      label: 'Adjustment Type',
      sortable: true,
      format: (value) => formatLabel(value),
    },
    { id: 'previous_quantity', label: 'Previous Quantity', sortable: true },
    { id: 'adjusted_quantity', label: 'Adjusted Quantity', sortable: true },
    { id: 'new_quantity', label: 'New Quantity', sortable: true },
    { id: 'comments', label: 'Comments', sortable: false },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value) => formatLabel(value),
    },
    { id: 'adjusted_by', label: 'Adjusted By', sortable: true },
    {
      id: 'local_adjustment_date',
      label: 'Adjustment Date',
      sortable: true,
      format: (value) => formatDate(value),
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
        setFilters((prev: AdjustmentReportParams) => ({
          ...prev,
          page: newPage,
        }));
        fetchReport({ ...filters, page: newPage });
      }}
      onRowsPerPageChange={(newLimit) => {
        setFilters((prev: AdjustmentReportParams) => ({
          ...prev,
          limit: newLimit,
          page: 1,
        })); // Reset to first page
        fetchReport({ ...filters, limit: newLimit, page: 1 });
      }}
    />
  );
};

export default AdjustmentReportTable;
