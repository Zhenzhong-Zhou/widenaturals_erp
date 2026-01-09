import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the inventory allocation slice of the Redux store.
 */
const selectInventoryAllocationsSlice= createSelector(
  [selectRuntime],
  (runtime) => runtime.paginatedInventoryAllocations
);

/**
 * Selector to retrieve the list of inventory allocation summaries.
 */
export const selectInventoryAllocations = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.data
);

/**
 * Selector to retrieve pagination information for inventory allocations.
 */
export const selectInventoryAllocationsPagination = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.pagination
);

/**
 * Selector to check if inventory allocations are currently loading.
 */
export const selectInventoryAllocationsLoading = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.loading
);

/**
 * Selector to get the last error message (if any) from fetching inventory allocations.
 */
export const selectInventoryAllocationsError = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => slice.error
);

/**
 * Selector for the current page number in paginated inventory allocations.
 *
 * @returns {number} - Current page number.
 */
export const selectInventoryAllocationsPage = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.page ?? 1
);

/**
 * Selector for the current pagination limit (number of inventory allocations per page).
 *
 * Useful for controlling how many allocations are shown per page in list views.
 *
 * @returns {number} - Number of records per page.
 */
export const selectInventoryAllocationsLimit = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.limit ?? 10
);

/**
 * Selector for the total number of inventory allocation records.
 *
 * @returns {number} - Total record count.
 */
export const selectInventoryAllocationsTotalRecords = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Selector for the total number of pages in the paginated inventory allocations result.
 *
 * @returns {number} - Total number of pages.
 */
export const selectInventoryAllocationsTotalPages = createSelector(
  [selectInventoryAllocationsPagination],
  (pagination) => pagination?.totalPages ?? 1
);

/**
 * Selector to determine if more pages of inventory allocations are available.
 */
export const selectInventoryAllocationsHasMore = createSelector(
  [selectInventoryAllocationsSlice],
  (slice) => {
    const page = slice.pagination?.page ?? 0;
    const limit = slice.pagination?.limit ?? 0;
    const total = slice.pagination?.totalRecords ?? 0;
    
    return page * limit < total;
  }
);
