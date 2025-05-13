import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { SkuWarehouseInventorySummary } from './warehouseInventoryTypes';

/**
 * Root selector for the warehouse inventory SKU summary slice.
 */
const selectWarehouseInventorySkuSummaryState = (state: RootState) =>
  state.warehouseInventorySkuSummary;

/**
 * Selects the SKU inventory summary data array.
 */
export const selectSkuSummaryData = createSelector(
  [selectWarehouseInventorySkuSummaryState],
  (state) => state.data
);

/**
 * Selects the pagination metadata for SKU inventory summary.
 */
export const selectSkuSummaryPagination = createSelector(
  [selectWarehouseInventorySkuSummaryState],
  (state) => state.pagination
);

/**
 * Selects the loading state for SKU inventory summary.
 */
export const selectSkuSummaryLoading = createSelector(
  [selectWarehouseInventorySkuSummaryState],
  (state) => state.loading
);

/**
 * Selects any error associated with SKU inventory summary fetching.
 */
export const selectSkuSummaryError = createSelector(
  [selectWarehouseInventorySkuSummaryState],
  (state) => state.error
);

/**
 * Calculates the total available quantity across all SKUs in the inventory summary.
 */
export const selectSkuSummaryTotalAvailableQuantity = createSelector(
  [selectSkuSummaryData],
  (data) =>
    data.reduce((sum: number, item: SkuWarehouseInventorySummary) => {
      return sum + Number(item.availableQuantity || 0);
    }, 0 as number)
);
