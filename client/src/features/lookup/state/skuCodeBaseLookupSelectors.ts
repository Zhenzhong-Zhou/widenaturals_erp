import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  SkuCodeBaseLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the SKU Code Base lookup slice.
 */
export const selectSkuCodeBaseLookupState = (state: RootState) =>
  state.skuCodeBaseLookup;

/**
 * Selector for retrieving SKU Code Base lookup items.
 */
export const selectSkuCodeBaseLookupItems = createSelector(
  [selectSkuCodeBaseLookupState],
  (state) => state.data
);

/**
 * Selector for loading state.
 */
export const selectSkuCodeBaseLookupLoading = createSelector(
  [selectSkuCodeBaseLookupState],
  (state) => state.loading
);

/**
 * Selector for error state.
 */
export const selectSkuCodeBaseLookupError = createSelector(
  [selectSkuCodeBaseLookupState],
  (state) => state.error
);

/**
 * Pagination metadata selector (limit, offset, hasMore).
 */
export const selectSkuCodeBaseLookupMeta = createLookupMetaSelector(
  selectSkuCodeBaseLookupState
);

/**
 * Maps SKU Code Base items to dropdown-friendly LookupOption[].
 * Includes isActive flag for UI rendering.
 */
export const selectSkuCodeBaseLookupOptions = createSelector(
  [selectSkuCodeBaseLookupItems],
  (items: SkuCodeBaseLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
