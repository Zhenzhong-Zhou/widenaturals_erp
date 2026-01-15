import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import { createLookupMetaSelector } from '@features/lookup/utils/lookupSelectorUtils';

/**
 * Base selector for the batch registry lookup slice.
 *
 * Internal-only extraction selector.
 * MUST remain a plain function.
 */
const selectBatchRegistryLookupSlice = (state: RootState) =>
  selectRuntime(state).batchRegistryLookup;

/**
 * Selects loading state for the batch registry lookup request.
 */
export const selectBatchRegistryLookupLoading = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.loading
);

/**
 * Selects error message from the batch registry lookup slice, if any.
 */
export const selectBatchRegistryLookupError = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.error
);

/**
 * Selects lookup result items for batch registry.
 */
export const selectBatchRegistryLookupItems = createSelector(
  [selectBatchRegistryLookupSlice],
  (slice) => slice.data
);

/**
 * Selects lookup metadata (pagination and availability flags).
 *
 * Returns `{ hasMore, limit, offset }`.
 */
export const selectBatchRegistryLookupMeta = createLookupMetaSelector(
  selectBatchRegistryLookupSlice
);
