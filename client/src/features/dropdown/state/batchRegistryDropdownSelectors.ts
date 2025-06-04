import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the batch registry dropdown state slice.
 */
const selectBatchRegistryDropdownSlice = (state: RootState) => state.batchRegistryDropdown;

/**
 * Selector to get loading state of the dropdown.
 */
export const selectBatchRegistryDropdownLoading = createSelector(
  [selectBatchRegistryDropdownSlice],
  (slice) => slice.loading
);

/**
 * Selector to get error state of the dropdown.
 */
export const selectBatchRegistryDropdownError = createSelector(
  [selectBatchRegistryDropdownSlice],
  (slice) => slice.error
);

/**
 * Selector to get dropdown items.
 */
export const selectBatchRegistryDropdownItems = createSelector(
  [selectBatchRegistryDropdownSlice],
  (slice) => slice.data
);

/**
 * Selector to get `hasMore` flag for pagination.
 */
export const selectBatchRegistryDropdownHasMore = createSelector(
  [selectBatchRegistryDropdownSlice],
  (slice) => slice.hasMore
);

/**
 * Selector to get pagination values: limit and offset.
 */
export const selectBatchRegistryDropdownPagination = createSelector(
  [selectBatchRegistryDropdownSlice],
  (slice) => ({
    limit: slice.limit,
    offset: slice.offset,
  })
);

/**
 * Composite selector to get the entire dropdown state.
 */
export const selectBatchRegistryDropdownState = createSelector(
  [selectBatchRegistryDropdownSlice],
  (slice) => ({
    loading: slice.loading,
    error: slice.error,
    items: slice.items,
    hasMore: slice.hasMore,
    limit: slice.limit,
    offset: slice.offset,
  })
);
