import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the batch registry lookup state slice.
 */
const selectBatchRegistryLookupSlice = (state: RootState) =>
  state.batchRegistryLookup;

/**
 * Selector to get loading state of the lookup.
 */
export const selectBatchRegistryLookupLoading = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.loading
);

/**
 * Selector to get error state of the lookup.
 */
export const selectBatchRegistryLookupError = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.error
);

/**
 * Selector to get lookup items.
 */
export const selectBatchRegistryLookupItems = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.data
);

/**
 * Selector to get `hasMore` flag for pagination.
 */
export const selectBatchRegistryLookupHasMore = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.hasMore
);

/**
 * Selector to get pagination values: limit and offset.
 */
export const selectBatchRegistryLookupPagination = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => ({
    limit: slice.limit,
    offset: slice.offset,
  })
);

/**
 * Composite selector to get the entire lookup state.
 */
export const selectBatchRegistryLookupState = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => ({
    loading: slice.loading,
    error: slice.error,
    items: slice.items,
    hasMore: slice.hasMore,
    limit: slice.limit,
    offset: slice.offset,
  })
);
