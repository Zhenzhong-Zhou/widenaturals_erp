import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { InventoryActivityLogsState } from '@features/report';

// **Base Selectors**
const selectInventoryActivityLogsState = (state: RootState) =>
  state.inventoryActivityLogs;

export const selectInventoryActivityLogs = createSelector(
  selectInventoryActivityLogsState,
  (inventoryLogs: InventoryActivityLogsState) => ({
    inventoryLogs: inventoryLogs.data ?? [],
    isLoading: inventoryLogs.loading,
    error: inventoryLogs.error,
    pagination: {
      page: inventoryLogs.pagination?.page ?? 1,
      limit: inventoryLogs.pagination?.limit ?? 50,
      totalRecords: inventoryLogs.pagination?.totalRecords ?? 0,
      totalPages: inventoryLogs.pagination?.totalPages ?? 1,
    },
    exportData: inventoryLogs.exportData,
    exportFormat: inventoryLogs.exportFormat ?? 'csv',
    exportLoading: inventoryLogs.exportLoading,
    exportError: inventoryLogs.exportError,
  })
);
