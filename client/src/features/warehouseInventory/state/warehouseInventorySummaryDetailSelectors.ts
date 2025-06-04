import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the warehouse inventory summary detail slice.
 */
const selectWarehouseInventorySummaryDetailState = (state: RootState) =>
  state.warehouseInventorySummaryDetail;

/**
 * Selector for retrieving the list of warehouse inventory summary items.
 *
 * @returns {WarehouseInventorySummaryItemDetails[]} Array of transformed inventory data.
 */
export const selectWarehouseInventorySummaryItemDetailsData = createSelector(
  [selectWarehouseInventorySummaryDetailState],
  (state) => state.data
);

/**
 * Selector for retrieving pagination metadata for warehouse inventory summary.
 *
 * @returns {Pagination} Pagination object including page, limit, totalRecords, and totalPages.
 */
export const selectWarehouseInventorySummaryItemDetailsPagination =
  createSelector(
    [selectWarehouseInventorySummaryDetailState],
    (state) => state.pagination
  );

/**
 * Selector for checking if the warehouse inventory summary data is being loaded.
 *
 * @returns {boolean} Loading state.
 */
export const selectWarehouseInventorySummaryItemDetailsLoading = createSelector(
  [selectWarehouseInventorySummaryDetailState],
  (state) => state.loading
);

/**
 * Selector for retrieving any error message related to warehouse inventory summary fetch.
 *
 * @returns {string | null} Error message or null.
 */
export const selectWarehouseInventorySummaryItemDetailsError = createSelector(
  [selectWarehouseInventorySummaryDetailState],
  (state) => state.error
);
