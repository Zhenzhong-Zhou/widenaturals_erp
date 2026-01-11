import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the warehouseInventory slice from the root state.
 */
const selectWarehouseInventoryState = createSelector(
  [selectRuntime],
  (runtime) => runtime.warehouseInventory
);

/**
 * Selector to get the inventory record list.
 *
 * @returns {WarehouseInventoryRecord[]} Array of warehouse inventory records.
 */
export const selectWarehouseInventoryRecords = createSelector(
  [selectWarehouseInventoryState],
  (state) => state.data
);

/**
 * Selector to get the loading state for warehouse inventory.
 *
 * @returns {boolean} True if data is being fetched.
 */
export const selectWarehouseInventoryLoading = createSelector(
  [selectWarehouseInventoryState],
  (state) => state.loading
);

/**
 * Selector to get the error state for warehouse inventory.
 *
 * @returns {string | null} Error message if request failed.
 */
export const selectWarehouseInventoryError = createSelector(
  [selectWarehouseInventoryState],
  (state) => state.error
);

/**
 * Selector to get the pagination info for warehouse inventory.
 *
 * @returns {Pagination | null} Pagination metadata (page, limit, totalRecords, etc.)
 */
export const selectWarehouseInventoryPagination = createSelector(
  [selectWarehouseInventoryState],
  (state) => state.pagination
);
