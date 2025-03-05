import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInventoryActivityLogs } from '../../../hooks';
import Box from '@mui/material/Box';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  GoBackButton,
  Loading,
  NoDataFound,
  Typography,
} from '@components/index.ts';
import InventoryActivityLogTable from '../components/InventoryActivityLogTable.tsx';
import { handleDownload } from '@utils/downloadUtils.ts';
import { AdjustmentReportFilters, ExportAdjustmentReportModal } from '../index.ts';

const InventoryActivityLogPage = () => {
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
  
  const {
    inventoryLogs,
    isLoading,
    error,
    pagination,
    fetchInventoryActivityLogs,
    exportLogs,
    exportData,
    exportFormat,
    exportLoading,
    exportError,
  } = useInventoryActivityLogs(filters);
  
  const defaultWarehouseName = 'Warehouse Activity Logs Overview';
  const defaultItemName = 'Inventory Activity Logs Overview';
  
  // Get valid log entry if data exists
  const logEntry =
    inventoryLogs && inventoryLogs.length > 0
      ? inventoryLogs.find(
        (entry) => entry.warehouse_name?.trim() || entry.item_name?.trim()
      )
      : undefined;
  
  // Extract values
  const warehouseName = logEntry?.warehouse_name || defaultWarehouseName;
  const itemName = logEntry?.item_name || defaultItemName;
  
  // Determine the correct report title
  let pageTitle = `${warehouseName} Inventory`;
  let subtitle = `${itemName} Adjustment Report`;
  
  // Handle different scenarios dynamically
  if (!warehouseId && !inventoryId) {
    pageTitle = 'Warehouse & Inventory Activity Logs Overview';
    subtitle = 'Company-wide Inventory Activity Logs';
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
    fetchInventoryActivityLogs();
  }, [fetchInventoryActivityLogs]);
  
  useEffect(() => {
    if (!exportData) return; // Ensure there's data to download
    
    const fileExtension = exportFormat || 'csv';
    const formattedDate = new Date().toISOString().slice(0, 10);
    
    // Ensure values exist before using them
    const safeWarehouseName =
      warehouseName?.replace(/\s+/g, '_') || 'Warehouse';
    const safeItemName = itemName?.replace(/\s+/g, '_') || 'Item';
    
    const fileName = `Inventory_Activity_Logs_${safeWarehouseName}_${safeItemName}_${formattedDate}.${fileExtension}`;
    
    handleDownload(exportData, fileName);
  }, [exportData, exportFormat, warehouseName, itemName]); // Add dependencies for dynamic updates
  
  const safePagination = pagination || { totalPages: 1, totalRecords: 0, page: 1, limit: 10 };
  
  if (isLoading)
    return (
      <Loading message="Loading Warehouse Inventory Activity Logs..." />
    );
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  if (!inventoryLogs)
    return (
      <NoDataFound message="No warehouse inventory activity logs found." />
    );
  if (exportLoading)
    return (
      <Loading message="Exporting Warehouse Inventory Activity Logs..." />
    );
  if (exportError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={exportError} />
      </ErrorDisplay>
    );
  if (!logEntry)
    return (
      <NoDataFound message="No warehouse inventory activity logs found." />
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
        <CustomButton variant="outlined" onClick={() => fetchInventoryActivityLogs(filters)}>
          Refresh Data
        </CustomButton>
        <CustomButton variant="contained" onClick={() => setOpen(true)}>
          Export Report
        </CustomButton>
        <ExportAdjustmentReportModal
          open={open}
          onClose={() => setOpen(false)}
          onExport={exportLogs}
          filters={filters}
        />
      </Box>
      
      {/* Table */}
      <InventoryActivityLogTable
        data={inventoryLogs}
        pagination={safePagination}
        filters={filters}
        setFilters={setFilters}
        fetchInventoryActivityLogs={fetchInventoryActivityLogs}
      />
    </Box>
  );
};

export default InventoryActivityLogPage;
