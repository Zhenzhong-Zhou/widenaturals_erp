import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const EMPTY_ARRAY: never[] = [];

/**
 * Base selector for the paginated Warehouse Inventory slice.
 * Extracts the entire `paginatedWarehouseInventory` state from the Redux store.
 */
const selectPaginatedWarehouseInventoryState = (state: RootState) =>
  selectRuntime(state).paginatedWarehouseInventory;

/**
 * Selector: Returns the array of flattened warehouse inventory records.
 */
export const selectPaginatedWarehouseInventoryData = createSelector(
  [selectPaginatedWarehouseInventoryState],
  (state) => state.data ?? EMPTY_ARRAY
);

/**
 * Selector: Indicates whether the warehouse inventory list request is currently loading.
 */
export const selectPaginatedWarehouseInventoryLoading = createSelector(
  [selectPaginatedWarehouseInventoryState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the warehouse inventory list state, if any.
 */
export const selectPaginatedWarehouseInventoryError = createSelector(
  [selectPaginatedWarehouseInventoryState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: Returns the pagination metadata for the warehouse inventory list.
 */
export const selectPaginatedWarehouseInventoryPagination = createSelector(
  [selectPaginatedWarehouseInventoryState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` if the warehouse inventory list is loaded and empty.
 */
export const selectPaginatedWarehouseInventoryIsEmpty = createSelector(
  [selectPaginatedWarehouseInventoryData, selectPaginatedWarehouseInventoryLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector: Returns the total number of warehouse inventory records across all pages.
 */
export const selectPaginatedWarehouseInventoryTotalRecords = createSelector(
  [selectPaginatedWarehouseInventoryPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
