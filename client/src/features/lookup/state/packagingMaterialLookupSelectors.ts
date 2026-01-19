import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  PackagingMaterialOnlyLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the packaging-material lookup slice.
 */
const selectPackagingMaterialLookupState = (state: RootState) =>
  selectRuntime(state).packagingMaterialLookup;

/**
 * Selector for retrieving the list of packaging-material lookup items.
 */
export const selectPackagingMaterialLookupItems = createSelector(
  [selectPackagingMaterialLookupState],
  (state) => state.data
);

/**
 * Selector for the loading state of the packaging-material lookup fetch.
 */
export const selectPackagingMaterialLookupLoading = createSelector(
  [selectPackagingMaterialLookupState],
  (state) => state.loading
);

/**
 * Selector for any error that occurred while fetching packaging-material lookup data.
 */
export const selectPackagingMaterialLookupError = createSelector(
  [selectPackagingMaterialLookupState],
  (state) => state.error
);

/**
 * Selects pagination metadata for the packaging-material lookup slice.
 * Includes `hasMore`, `limit`, and `offset` used for pagination controls.
 */
export const selectPackagingMaterialLookupMeta = createLookupMetaSelector(
  selectPackagingMaterialLookupState
);

/**
 * Selector that maps packaging-material lookup items to dropdown options,
 * including optional status flags when present (`isActive`, `isArchived`).
 */
export const selectPackagingMaterialLookupOptions = createSelector(
  [selectPackagingMaterialLookupItems],
  (items: PackagingMaterialOnlyLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'isArchived'])
);
