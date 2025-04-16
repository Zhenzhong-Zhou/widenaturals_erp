import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base Selector
const selectWarehouseInventoryState = (state: RootState) =>
  state.warehouseInventoriesSummary;

// Memoized Selectors
export const selectWarehouseInventorySummary = createSelector(
  [selectWarehouseInventoryState],
  (inventoryState) => inventoryState.data
);

export const selectWarehouseInventorySummaryPagination = createSelector(
  [selectWarehouseInventoryState],
  (inventoryState) => inventoryState.pagination
);

export const selectWarehouseInventorySummaryLoading = createSelector(
  [selectWarehouseInventoryState],
  (inventoryState) => inventoryState.loading
);

export const selectWarehouseInventorySummaryError = createSelector(
  [selectWarehouseInventoryState],
  (inventoryState) => inventoryState.error
);
