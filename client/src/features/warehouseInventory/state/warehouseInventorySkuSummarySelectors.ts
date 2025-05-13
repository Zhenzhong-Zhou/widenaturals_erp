import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { WarehouseInventoryItemSummary } from './warehouseInventoryTypes';

/**
 * Root selector for the warehouse inventory item summary slice.
 */
const selectWarehouseInventoryItemSummaryState = (state: RootState) =>
  state.warehouseInventoryItemSummary;

/**
 * Selects the full inventory summary data array (products and materials).
 */
export const selectWarehouseInventoryItemSummaryData = createSelector(
  [selectWarehouseInventoryItemSummaryState],
  (state) => state.data
);

/**
 * Selects the pagination metadata for warehouse inventory summary.
 */
export const selectWarehouseInventoryItemSummaryPagination = createSelector(
  [selectWarehouseInventoryItemSummaryState],
  (state) => state.pagination
);

/**
 * Selects the loading state for the warehouse inventory summary.
 */
export const selectWarehouseInventoryItemSummaryLoading = createSelector(
  [selectWarehouseInventoryItemSummaryState],
  (state) => state.loading
);

/**
 * Selects any error associated with warehouse inventory summary fetching.
 */
export const selectWarehouseInventoryItemSummaryError = createSelector(
  [selectWarehouseInventoryItemSummaryState],
  (state) => state.error
);

/**
 * Calculates the total available quantity across all inventory items (products + materials).
 */
export const selectTotalAvailableQuantity = createSelector(
  [selectWarehouseInventoryItemSummaryData],
  (data) =>
    data.reduce((sum: number, item: WarehouseInventoryItemSummary) => {
      return sum + Number(item.availableQuantity || 0);
    }, 0)
);
