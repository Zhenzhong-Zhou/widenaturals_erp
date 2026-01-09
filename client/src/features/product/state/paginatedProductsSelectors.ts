import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated Product slice.
 * Extracts the entire `paginatedProducts` state from the Redux store.
 */
const selectPaginatedProductsState = createSelector(
  [selectRuntime],
  (runtime) => runtime.paginatedProducts
);

/**
 * Selector: Returns the array of Product list items.
 * Memoized using `createSelector`.
 */
export const selectPaginatedProductsData = createSelector(
  [selectPaginatedProductsState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the Product list request is currently loading.
 */
export const selectPaginatedProductsLoading = createSelector(
  [selectPaginatedProductsState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the Product list state, if any.
 */
export const selectPaginatedProductsError = createSelector(
  [selectPaginatedProductsState],
  (state) => state.error
);

/**
 * Selector: Returns the pagination metadata for the Product list.
 */
export const selectPaginatedProductsPagination = createSelector(
  [selectPaginatedProductsState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` if product list is loaded and empty.
 */
export const selectPaginatedProductsIsEmpty = createSelector(
  [selectPaginatedProductsData, selectPaginatedProductsLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector: Returns the total number of Product records across all pages.
 */
export const selectPaginatedProductsTotalRecords = createSelector(
  [selectPaginatedProductsPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
