import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAdjustmentReport } from '../../../hooks';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  GoBackButton,
  Loading,
  NoDataFound,
  Typography,
} from '@components/index.ts';
import {
  AdjustmentReportFilters,
  AdjustmentReportTable,
  ExportAdjustmentReportModal,
} from '../index.ts';
import { handleDownload } from '@utils/downloadUtils.ts';

const AdjustmentReportPage: FC = () => {
  // Get optional parameters from URL
  const { warehouseId, inventoryId, warehouseInventoryLotId } = useParams<{
    warehouseId?: string;
    inventoryId?: string;
    warehouseInventoryLotId?: string;
  }>();
  const [filters, setFilters] = useState({
    reportType: null,
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startDate: null,
    endDate: null,
    warehouseId: warehouseId || null,
    inventoryId: inventoryId || null,
    warehouseInventoryLotId: warehouseInventoryLotId || null,
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

  const defaultWarehouseName = 'Warehouse Overview';
  const defaultItemName = 'Inventory Overview';

  // Get valid report entry if data exists
  const reportEntry =
    data && data.length > 0
      ? data.find(
          (entry) => entry.warehouse_name?.trim() || entry.item_name?.trim()
        )
      : undefined;

  // Extract values
  const warehouseName = reportEntry?.warehouse_name || defaultWarehouseName;
  const itemName = reportEntry?.item_name || defaultItemName;

  // Determine the correct report title
  let pageTitle = `${warehouseName} Inventory`;
  let subtitle = `${itemName} Adjustment Report`;

  // Handle different scenarios dynamically
  if (!warehouseId && !inventoryId) {
    pageTitle = 'Warehouse & Inventory Overview';
    subtitle = 'Company-wide Adjustment Report';
  } else if (warehouseId && !inventoryId) {
    pageTitle = `${warehouseName} Overview`;
    subtitle = 'Warehouse-Specific Adjustment Report';
  } else if (!warehouseId && inventoryId) {
    pageTitle = `Inventory Report for ${itemName}`;
    subtitle = 'Item-Specific Adjustment Report';
  } else if (warehouseId && inventoryId) {
    pageTitle = `${warehouseName} Inventory Report`;
    subtitle = `${itemName} Adjustment Report`;
  } else if (warehouseId && warehouseInventoryLotId) {
    pageTitle = `${warehouseName} Lot Report`;
    subtitle = `Lot Adjustment Report for ${warehouseInventoryLotId}`;
  } else if (!warehouseId && warehouseInventoryLotId) {
    pageTitle = `Lot Report for ${warehouseInventoryLotId}`;
    subtitle = 'Lot Adjustment Report';
  }

  // Fetch report data on mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!exportData) return; // Ensure there's data to download

    const fileExtension = exportFormat || 'csv';
    const formattedDate = new Date().toISOString().slice(0, 10);

    // Ensure values exist before using them
    const safeWarehouseName =
      warehouseName?.replace(/\s+/g, '_') || 'Warehouse';
    const safeItemName = itemName?.replace(/\s+/g, '_') || 'Item';

    const fileName = `Adjustment_Report_${safeWarehouseName}_${safeItemName}_${formattedDate}.${fileExtension}`;

    handleDownload(exportData, fileName);
  }, [exportData, exportFormat, warehouseName, itemName]); // Add dependencies for dynamic updates

  if (loading)
    return (
      <Loading message="Loading Warehouse Inventory Adjustment Report..." />
    );
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!data)
    return (
      <NoDataFound message="No warehouse inventory adjustment records found." />
    );
  if (exportLoading)
    return (
      <Loading message="Exporting Warehouse Inventory Adjustment Report..." />
    );
  if (exportError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={exportError} />
      </ErrorDisplay>
    );
  if (!reportEntry)
    return (
      <NoDataFound message="No warehouse inventory adjustment records found." />
    );

  return (
    <Box sx={{ padding: 2, marginBottom: 3 }}>
      <GoBackButton />
      <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {pageTitle}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {subtitle}
        </Typography>
      </Box>

      {/* Filters */}
      <AdjustmentReportFilters filters={filters} setFilters={setFilters} />

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 2,
        }}
      >
        <CustomButton variant="outlined" onClick={() => fetchReport(filters)}>
          Refresh Data
        </CustomButton>
        <CustomButton variant="contained" onClick={() => setOpen(true)}>
          Export Report
        </CustomButton>
        <ExportAdjustmentReportModal
          open={open}
          onClose={() => setOpen(false)}
          onExport={exportReport}
          filters={filters}
        />
      </Box>

      {/* Table */}
      <AdjustmentReportTable
        data={data}
        pagination={pagination}
        filters={filters}
        setFilters={setFilters}
        fetchReport={fetchReport}
      />
    </Box>
  );
};

export default AdjustmentReportPage;
