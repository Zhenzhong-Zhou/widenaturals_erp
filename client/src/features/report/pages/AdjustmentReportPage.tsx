import { FC, useEffect, useState } from "react";
import { useAdjustmentReport } from "../../../hooks";
import { CustomButton, ErrorDisplay, ErrorMessage, Loading, Typography } from "@components/index.ts";
import Box from "@mui/material/Box";
import { AdjustmentReportFilters, AdjustmentReportTable, ExportAdjustmentReportModal } from '../index.ts';
import { handleDownload } from "@utils/downloadUtils.ts";

const AdjustmentReportPage: FC = () => {
  const [filters, setFilters] = useState({
    reportType: null,
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
  
  useEffect(() => {
    if (exportData) {
      const fileExtension = exportFormat || "csv";
      handleDownload(exportData, `Adjustment_Report_${new Date().toISOString().slice(0, 10)}.${fileExtension}`);
    }
  }, [exportData, exportFormat]);
  
  if (loading) return <Loading message="Loading Warehouse Inventory Adjustment Report..." />;
  if (error) return <ErrorDisplay><ErrorMessage message={error} /></ErrorDisplay>;
  if (!data) return <Typography variant="h4">No warehouse inventory adjustment records found.</Typography>;
  if (exportLoading) return <Loading message="Exporting Warehouse Inventory Adjustment Report..." />;
  if (exportError) return <ErrorDisplay><ErrorMessage message={exportError} /></ErrorDisplay>;
  
  return (
    <Box sx={{ padding: 2, marginBottom: 3 }}>
      <Box sx={{ textAlign: "center", marginBottom: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Warehouse Inventory
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Adjustment Report Overview
        </Typography>
      </Box>
      
      {/* Filters */}
      <AdjustmentReportFilters filters={filters} setFilters={setFilters} />
      
      {/* Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <CustomButton variant="outlined" onClick={() => fetchReport(filters)}>Refresh Data</CustomButton>
        <CustomButton variant="contained" onClick={() => setOpen(true)}>Export Report</CustomButton>
        <ExportAdjustmentReportModal open={open} onClose={() => setOpen(false)} onExport={exportReport} filters={filters} />
      </Box>
      
      {/* Table */}
      <AdjustmentReportTable data={data} pagination={pagination} filters={filters} setFilters={setFilters} fetchReport={fetchReport} />
    </Box>
  );
};

export default AdjustmentReportPage;
