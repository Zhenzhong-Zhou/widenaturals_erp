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
 * Composite selector for lookup metadata (pagination + availability).
 *
 * @returns Object containing limit, offset, and hasMore
 */
export const selectBatchRegistryLookupMeta = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => ({
    limit: slice.limit,
    offset: slice.offset,
    hasMore: slice.hasMore,
  })
);
