import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  ProductLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the Product lookup slice.
 */
const selectProductLookupState = (state: RootState) =>
  selectRuntime(state).productLookup;

/**
 * Retrieves product lookup items.
 */
export const selectProductLookupItems = createSelector(
  [selectProductLookupState],
  (state) => state.data
);

/**
 * Loading state.
 */
export const selectProductLookupLoading = createSelector(
  [selectProductLookupState],
  (state) => state.loading
);

/**
 * Error state.
 */
export const selectProductLookupError = createSelector(
  [selectProductLookupState],
  (state) => state.error
);

/**
 * Pagination metadata (limit, offset, hasMore).
 */
export const selectProductLookupMeta = createLookupMetaSelector(
  selectProductLookupState
);

/**
 * Maps Product lookup items to LookupOption[].
 * Products currently only use `isActive`.
 */
export const selectProductLookupOptions = createSelector(
  [selectProductLookupItems],
  (items: ProductLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
