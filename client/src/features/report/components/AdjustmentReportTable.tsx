import React from 'react';
import CustomTable from '@components/common/CustomTable.tsx';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import { Column } from '@components/common/CustomTable.tsx';
import { AdjustmentReportParams } from '../state/reportTypes.ts';

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

const AdjustmentReportTable: React.FC<AdjustmentReportTableProps> = ({
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
      format: (value) => capitalizeFirstLetter(value),
    },
    { id: 'previous_quantity', label: 'Previous Quantity', sortable: true },
    { id: 'adjusted_quantity', label: 'Adjusted Quantity', sortable: true },
    { id: 'new_quantity', label: 'New Quantity', sortable: true },
    { id: 'comments', label: 'Comments', sortable: false },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value) => capitalizeFirstLetter(value),
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
      rowsPerPageOptions={[10, 20, 40, 60]}
      initialRowsPerPage={filters.limit}
      totalPages={pagination.totalPages}
      totalRecords={pagination.totalRecords}
      page={filters.page ?? 1}
      onPageChange={(newPage) => {
        setFilters((prev: AdjustmentReportParams) => ({
          ...prev,
          page: newPage + 1,
        }));
        fetchReport({ ...filters, page: newPage + 1 });
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
