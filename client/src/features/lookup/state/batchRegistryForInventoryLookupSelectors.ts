import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import { createLookupMetaSelector } from '@features/lookup/utils/lookupSelectorUtils';

/**
 * Base selector for the batch registry for-inventory lookup slice.
 *
 * Internal-only extraction selector.
 * MUST remain a plain function.
 */
const selectBatchRegistryForInventoryLookupSlice = (state: RootState) =>
  selectRuntime(state).batchRegistryForInventoryLookup;

/**
 * Selects loading state for the batch registry for-inventory lookup request.
 */
export const selectBatchRegistryForInventoryLookupLoading = createSelector(
  [selectBatchRegistryForInventoryLookupSlice],
  (slice) => slice.loading
);

/**
 * Selects error message from the batch registry for-inventory lookup slice, if any.
 */
export const selectBatchRegistryForInventoryLookupError = createSelector(
  [selectBatchRegistryForInventoryLookupSlice],
  (slice): string | null => slice.error?.message ?? null
);

/**
 * Selects lookup result items for the batch registry for-inventory request.
 */
export const selectBatchRegistryForInventoryLookupItems = createSelector(
  [selectBatchRegistryForInventoryLookupSlice],
  (slice) => slice.data
);

/**
 * Selects lookup metadata (pagination and availability flags).
 *
 * Returns `{ hasMore, limit, offset }`.
 */
export const selectBatchRegistryForInventoryLookupMeta =
  createLookupMetaSelector(selectBatchRegistryForInventoryLookupSlice);
