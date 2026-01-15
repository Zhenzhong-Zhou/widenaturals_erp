import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated inventory allocations state slice.
 *
 * Responsibilities:
 * - Extract the paginated inventory allocations state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectInventoryAllocationsSlice = (state: RootState) =>
  selectRuntime(state).paginatedInventoryAllocations;

/**
 * Selects the list of inventory allocation summaries.
 */
export const selectInventoryAllocations = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.data
);

/**
 * Selects pagination metadata for inventory allocations.
 */
export const selectInventoryAllocationsPagination = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.pagination
);

/**
 * Selects whether inventory allocations are currently loading.
 */
export const selectInventoryAllocationsLoading = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.loading
);

/**
 * Selects the last error message (if any) from fetching inventory allocations.
 */
export const selectInventoryAllocationsError = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.error
);

/**
 * Selects the current page number.
 *
 * Returns `1` when pagination is not yet available.
 */
export const selectInventoryAllocationsPage = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.page ?? 1
);

/**
 * Selects the current pagination limit (records per page).
 *
 * Returns `10` when pagination is not yet available.
 */
export const selectInventoryAllocationsLimit = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.limit ?? 10
);

/**
 * Selects the total number of inventory allocation records.
 */
export const selectInventoryAllocationsTotalRecords = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Selects the total number of pages available.
 *
 * Returns `1` when pagination is not yet available.
 */
export const selectInventoryAllocationsTotalPages = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.totalPages ?? 1
);

/**
 * Determines whether more pages of inventory allocations are available.
 *
 * Computed as: `page * limit < totalRecords`.
 */
export const selectInventoryAllocationsHasMore = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => {
    const { page = 0, limit = 0, totalRecords = 0 } = slice.pagination ?? {};
    return page * limit < totalRecords;
  }
);
