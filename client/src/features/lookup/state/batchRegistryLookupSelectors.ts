import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import { createLookupMetaSelector } from '@features/lookup/utils/lookupSelectorUtils';

/**
 * Base selector to access the batch registry lookup state slice.
 */
const selectBatchRegistryLookupSlice = (state: RootState) =>
  selectRuntime(state).batchRegistryLookup;

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
 * Selector for batch registry lookup metadata (pagination and availability).
 *
 * Returns `{ hasMore, limit, offset }` from the lookup slice.
 */
export const selectBatchRegistryLookupMeta = createLookupMetaSelector(
  selectBatchRegistryLookupSlice
);
