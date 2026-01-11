import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated SKU slice.
 * Extracts the entire `paginatedSkus` state from the Redux store.
 */
export const selectPaginatedSkusState = createSelector(
  [selectRuntime],
  (runtime) => runtime.paginatedSkus
);

/**
 * Selector: Returns the array of SKU list items.
 * Memoized using `createSelector`.
 */
export const selectPaginatedSkusData = createSelector(
  [selectPaginatedSkusState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the SKU list request is currently loading.
 */
export const selectPaginatedSkusLoading = createSelector(
  [selectPaginatedSkusState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the SKU list state, if any.
 */
export const selectPaginatedSkusError = createSelector(
  [selectPaginatedSkusState],
  (state) => state.error
);

/**
 * Selector: Returns the pagination metadata for the SKU list.
 */
export const selectPaginatedSkusPagination = createSelector(
  [selectPaginatedSkusState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the SKU list is loaded and empty.
 */
export const selectPaginatedSkusIsEmpty = createSelector(
  [selectPaginatedSkusData, selectPaginatedSkusLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector: Returns the total number of SKU records across all pages.
 */
export const selectPaginatedSkusTotalRecords = createSelector(
  [selectPaginatedSkusPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
