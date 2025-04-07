import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Direct state selectors
export const selectWarehouseItemSummaryState = (state: RootState) =>
  state.warehouseItems;

export const selectWarehouseItemLoading = (state: RootState) =>
  state.warehouseItems.loading;

export const selectWarehouseItemError = (state: RootState) =>
  state.warehouseItems.error;

export const selectWarehouseItemPagination = (state: RootState) =>
  state.warehouseItems.pagination;

// Optimized selector for item summary data
export const selectWarehouseItemSummary = createSelector(
  [selectWarehouseItemSummaryState],
  (warehouseItem) => warehouseItem.itemSummaryData
);
