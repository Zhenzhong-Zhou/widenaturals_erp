import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";
import { InventoryHistoryState } from './reportTypes.ts';

// ✅ Select the inventory history state
const selectInventoryHistoryState = (state: RootState): InventoryHistoryState =>
  state.inventoryHistory;

// Memoized Selector for Inventory History Data
export const selectInventoryHistory = createSelector(
  selectInventoryHistoryState,
  (inventory) => ({
    data: inventory.data ?? [], // Ensures `data` is always an array
    loading: inventory.loading,
    error: inventory.error,
    pagination: {
      page: inventory.pagination?.page ?? 1,
      limit: inventory.pagination?.limit ?? 50,
      totalRecords: inventory.pagination?.totalRecords ?? 0,
      totalPages: inventory.pagination?.totalPages ?? 1,
    },
    exportData: inventory.exportData, // Stores exported Blob file
    exportFormat: inventory.exportFormat ?? 'csv',
    exportLoading: inventory.exportLoading, // Export loading state
    exportError: inventory.exportError, // Export error message
  })
);
