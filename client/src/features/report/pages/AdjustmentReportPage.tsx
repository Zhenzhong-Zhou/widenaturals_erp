import { FC, useEffect, useState } from 'react';
import { useAdjustmentReport } from '../../../hooks';
import { CustomButton, CustomTable, ErrorDisplay, ErrorMessage, Loading, Typography } from '@components/index.ts';
import { AdjustmentReportParams } from '../state/reportTypes.ts';
import { Column } from '@components/common/CustomTable.tsx';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { capitalizeFirstLetter } from '@utils/textUtils.ts';
import Box from '@mui/material/Box';
import { ExportAdjustmentReportModal } from '../index.ts';
import { handleDownload } from '@utils/downloadUtils.ts';
import Dropdown from '@components/common/Dropdown.tsx';
import CustomDatePicker from '@components/common/CustomDatePicker.tsx';

const AdjustmentReportPage: FC = () => {
  const [filters, setFilters] = useState<Partial<AdjustmentReportParams>>({
    reportType: null,
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect timezone
    startDate: null,
    endDate: null,
    page: 1,
    limit: 10,
  });
  
  const [open, setOpen] = useState(false);
  
  // Use custom hook to fetch report data
  const {
    data,
    loading,
    error,
    pagination,
    fetchReport,
    exportReport,
    exportData,
    exportFormat,
    exportLoading,
    exportError,
  } = useAdjustmentReport(filters);
  
  // Fetch report data on mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  
  /**
   * Manually refresh the report data
   */
  const handleRefresh = () => {
    fetchReport(filters);
  };
  
  /**
   * Handle export action
   */
  const handleExport = async (exportParams: Partial<AdjustmentReportParams>) => {
    exportReport(exportParams);
  };
  
  /**
   * Trigger file download when export completes
   */
  useEffect(() => {
    if (exportData) {
      const fileExtension = exportFormat || 'csv';
      handleDownload(exportData, `Adjustment_Report_${new Date().toISOString().slice(0, 10)}.${fileExtension}`);
    }
  }, [exportData, exportFormat]);
  
  /**
   * Handle report type change (daily, weekly, monthly, yearly)
   */
  const handleReportTypeChange = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      reportType: value as AdjustmentReportParams['reportType'],
      startDate: value ? null : prev.startDate, // Reset start date if type is selected
      endDate: value ? null : prev.endDate, // Reset end date if type is selected
    }));
  };
  
  /**
   * Handle start date change
   */
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      // Convert selected date to YYYY-MM-DD format (keep local timezone)
      const localDate = formatDate(date);
      setFilters((prev) => ({ ...prev, startDate: localDate }));
    } else {
      setFilters((prev) => ({ ...prev, startDate: null }));
    }
  };
  
  /**
   * Handle end date change
   */
  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const localDate = formatDate(date);
      setFilters((prev) => ({ ...prev, endDate: localDate }));
    } else {
      setFilters((prev) => ({ ...prev, endDate: null }));
    }
  };
  
  // Define report type options
  const reportTypeOptions = [
    { value: null, label: 'Select A Type' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];
  
  // Define table columns
  const columns: Column[] = [
    { id: 'warehouse_name', label: 'Warehouse Name', sortable: true },
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
    },
    {
      id: 'adjusted_quantity',
      label: 'Adjusted Quantity',
      sortable: true,
    },
    {
      id: 'new_quantity',
      label: 'New Quantity',
      sortable: true,
    },
    {
      id: 'comments',
      label: 'Comments',
      sortable: false,
    },
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
  
  if (loading) return <Loading message="Loading Warehouse Inventory Adjustment Report..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  if (!data)
    return <Typography variant="h4">No warehouse inventory adjustment records found.</Typography>;
  
  if (exportLoading) return <Loading message="Exporting Warehouse Inventory Adjustment Report..." />;
  if (exportError) return <ErrorDisplay><ErrorMessage message={exportError} /></ErrorDisplay>;
  
  return (
    <Box sx={{ padding: 2, marginBottom: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Warehouse Inventory
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Adjustment Report Overview
        </Typography>
      </Box>
      
      {/* Filters: Report Type, Start Date, End Date */}
      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <Dropdown
          label="Report Type"
          options={reportTypeOptions}
          value={filters.reportType || ''}
          onChange={handleReportTypeChange}
        />
        <CustomDatePicker
          label="Start Date"
          value={filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null}
          onChange={handleStartDateChange}
          disabled={!!filters.reportType}
        />
        <CustomDatePicker
          label="End Date"
          value={filters.endDate ? new Date(`${filters.endDate}T00:00:00`) : null}
          onChange={handleEndDateChange}
          disabled={!!filters.reportType}
        />
      </Box>
      
      {/* Action Buttons: Refresh & Export */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        {/* Refresh Button */}
        <CustomButton variant="outlined" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </CustomButton>
        
        {/* Export Button */}
        <CustomButton variant="contained" onClick={() => setOpen(true)} disabled={exportLoading}>
          {exportLoading ? 'Exporting...' : 'Export Report'}
        </CustomButton>
        
        <ExportAdjustmentReportModal
          open={open}
          onClose={() => setOpen(false)}
          onExport={handleExport}
          filters={filters}
        />
      </Box>
      
      {/* Table Section */}
      <CustomTable
        columns={columns}
        data={data}
        rowsPerPageOptions={[10, 20, 40, 60]}
        initialRowsPerPage={filters.limit || pagination.limit}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        page={filters.page ?? 1}
        onPageChange={(newPage) => {
          setFilters((prev) => ({ ...prev, page: newPage + 1 }));
          fetchReport({ ...filters, page: newPage + 1 });
        }}
        onRowsPerPageChange={(newLimit) => {
          setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 })); // Reset to first page
          fetchReport({ ...filters, limit: newLimit, page: 1 });
        }}
      />
    </Box>
  );
};

export default AdjustmentReportPage;
