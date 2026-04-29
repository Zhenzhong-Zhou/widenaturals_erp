import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const EMPTY_ARRAY: never[] = [];

/**
 * Base selector for the paginated inventory allocation slice.
 */
const selectPaginatedInventoryAllocationState = (state: RootState) =>
  selectRuntime(state).paginatedInventoryAllocation;

/**
 * Selects the array of flattened inventory allocation summaries.
 */
export const selectPaginatedInventoryAllocationData = createSelector(
  [selectPaginatedInventoryAllocationState],
  (state) => state.data ?? EMPTY_ARRAY
);

/**
 * Selects whether the allocation list request is currently loading.
 */
export const selectPaginatedInventoryAllocationLoading = createSelector(
  [selectPaginatedInventoryAllocationState],
  (state) => state.loading
);

/**
 * Selects any error message from the allocation list state.
 */
export const selectPaginatedInventoryAllocationError = createSelector(
  [selectPaginatedInventoryAllocationState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selects the pagination metadata for the allocation list.
 */
export const selectPaginatedInventoryAllocationPagination = createSelector(
  [selectPaginatedInventoryAllocationState],
  (state) => state.pagination
);

/**
 * Selects `true` if the allocation list is loaded and empty.
 */
export const selectPaginatedInventoryAllocationIsEmpty = createSelector(
  [selectPaginatedInventoryAllocationData, selectPaginatedInventoryAllocationLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selects the total number of allocation records across all pages.
 */
export const selectPaginatedInventoryAllocationTotalRecords = createSelector(
  [selectPaginatedInventoryAllocationPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
