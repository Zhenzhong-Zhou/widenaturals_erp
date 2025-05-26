import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the locationInventory slice from the root state.
 */
const selectLocationInventoryState = (state: RootState) => {
  return state.locationInventory;
};

/**
 * Selector to get the inventory record list.
 *
 * @returns {LocationInventoryRecord[]} Array of location inventory records.
 */
export const selectLocationInventoryRecords = createSelector(
  [selectLocationInventoryState],
  (state) => state.data
);

/**
 * Selector to get the loading state for location inventory.
 *
 * @returns {boolean} True if data is being fetched.
 */
export const selectLocationInventoryLoading = createSelector(
  [selectLocationInventoryState],
  (state) => state.loading
);

/**
 * Selector to get the error state for location inventory.
 *
 * @returns {string | null} Error message if request failed.
 */
export const selectLocationInventoryError = createSelector(
  [selectLocationInventoryState],
  (state) => state.error
);

/**
 * Selector to get the pagination info for location inventory.
 *
 * @returns {PaginationInfo | null} Pagination metadata (page, limit, totalRecords, etc.)
 */
export const selectLocationInventoryPagination = createSelector(
  [selectLocationInventoryState],
  (state) => state.pagination
);
