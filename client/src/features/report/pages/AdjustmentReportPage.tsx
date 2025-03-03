import { FC, useState } from 'react';
import { useAdjustmentReport } from '../../../hooks';
import { CustomTable, ErrorDisplay, ErrorMessage, Loading, Typography } from '@components/index.ts';
import { AdjustmentReportParams } from '../state/reportTypes.ts';
import { Column } from '@components/common/CustomTable.tsx';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import Box from '@mui/material/Box';

const AdjustmentReportPage: FC = () => {
  const [filters, setFilters] = useState<Partial<AdjustmentReportParams>>({
    reportType: 'weekly',
    userTimezone: 'UTC',
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });
  
  // Use the custom hook to fetch report data
  const { data, loading, error, pagination, fetchReport } = useAdjustmentReport(filters);
  
  // Define table columns
  const columns: Column[] = [
    {
      id: 'warehouse_name',
      label: 'Warehouse Name',
      sortable: true,
    },
    { id: 'item_name', label: 'Item Name', sortable: true },
    {
      id: 'adjustment_type',
      label: 'Adjustment Type',
      sortable: true,
      format: (value) => capitalizeFirstLetter(value),
    },
    {
      id: 'previous_quantity',
      label: 'Previous Quantity',
      sortable: true,
      align: 'right'
    },
    {
      id: 'adjusted_quantity',
      label: 'Adjusted Quantity',
      sortable: true,
      align: 'right'
    },
    {
      id: 'new_quantity',
      label: 'New Quantity',
      sortable: true,
      align: 'right'
    },
    {
      id: 'comments',
      label: 'Comments',
      sortable: false,
      align: 'right'
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      format: (value) => capitalizeFirstLetter(value),
    },
    {
      id: 'adjusted_by',
      label: 'Adjusted By',
      sortable: true
    },
    {
      id: 'local_adjustment_date',
      label: 'Adjustment Date',
      sortable: true,
      format: (value) => formatDate(value),
    },
  ];
  
  if (loading)
    return <Loading message={`Warehouse Inventory Adjustment Report...`} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!data)
    return <Typography variant={'h4'}>No warehouse inventory adjustment records found.</Typography>;
  
  return (
    <Box sx={{ padding: 2, marginBottom: 3 }}>
      <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Warehouse Inventory
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Adjustment Report Overview
          {}
        </Typography>
      </Box>
      
      {/* Table Section */}
      <CustomTable
        columns={columns}
        data={data}
        rowsPerPageOptions={[10, 20, 40, 60]}
        initialRowsPerPage={filters.limit || pagination.limit}
        totalPages={filters.totalPages || pagination.totalPages}
        totalRecords={pagination.totalRecords}
        page={filters.page ?? 1}
        onPageChange={(newPage) => setFilters((prev) => {
          const updatedFilters = { ...prev, page: newPage + 1 };
          fetchReport(updatedFilters);
          return updatedFilters;
        })}
        onRowsPerPageChange={(newLimit) => setFilters((prev) => {
          const updatedFilters = { ...prev, limit: newLimit, page: 1 };
          fetchReport(updatedFilters);
          return updatedFilters;
        })}
      />
    </Box>
  );
};

export default AdjustmentReportPage;
