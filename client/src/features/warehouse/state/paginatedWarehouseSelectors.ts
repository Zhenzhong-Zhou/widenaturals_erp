/**
 * @file warehouseSelectors.ts
 *
 * Redux selectors for the Warehouse domain.
 * Covers paginated list and detail view state.
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const EMPTY_ARRAY: never[] = [];

/**
 * Base selector for the paginated Warehouse slice.
 * Extracts the entire `paginatedWarehouses` state from the Redux store.
 */
const selectPaginatedWarehousesState = (state: RootState) =>
  selectRuntime(state).paginatedWarehouses;

/**
 * Selector: Returns the array of warehouse records for the current page.
 */
export const selectPaginatedWarehousesData = createSelector(
  [selectPaginatedWarehousesState],
  (state) => state.data ?? EMPTY_ARRAY
);

/**
 * Selector: Indicates whether the warehouse list request is currently loading.
 */
export const selectPaginatedWarehousesLoading = createSelector(
  [selectPaginatedWarehousesState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the warehouse list state, if any.
 */
export const selectPaginatedWarehousesError = createSelector(
  [selectPaginatedWarehousesState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: Returns the pagination metadata for the warehouse list.
 */
export const selectPaginatedWarehousesPagination = createSelector(
  [selectPaginatedWarehousesState],
  (state) => state.pagination
);

/**
 * Selector: Returns true if the warehouse list is loaded and empty.
 */
export const selectPaginatedWarehousesIsEmpty = createSelector(
  [selectPaginatedWarehousesData, selectPaginatedWarehousesLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector: Returns the total number of warehouse records across all pages.
 */
export const selectPaginatedWarehousesTotalRecords = createSelector(
  [selectPaginatedWarehousesPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
