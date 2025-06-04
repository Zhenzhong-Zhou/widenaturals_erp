import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { InventoryHistoryState } from '@features/report';

/**
 * Base selector to retrieve the inventory history state from the root state.
 */
const selectInventoryHistoryState = (state: RootState): InventoryHistoryState =>
  state.inventoryHistory as InventoryHistoryState;

/**
 * Memoized selector that returns the entire inventory history state with fallback defaults.
 */
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
