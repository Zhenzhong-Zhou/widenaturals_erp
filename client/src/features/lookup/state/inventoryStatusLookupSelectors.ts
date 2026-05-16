import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  InventoryStatusLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectInventoryStatusLookupState = (state: RootState) =>
  selectRuntime(state).inventoryStatusLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectInventoryStatusLookupItems = createSelector(
  [selectInventoryStatusLookupState],
  (state) => state.data
);

export const selectInventoryStatusLookupLoading = createSelector(
  [selectInventoryStatusLookupState],
  (state) => state.loading
);

export const selectInventoryStatusLookupError = createSelector(
  [selectInventoryStatusLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectInventoryStatusLookupMeta = createLookupMetaSelector(
  selectInventoryStatusLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectInventoryStatusLookupOptions = createSelector(
  [selectInventoryStatusLookupItems],
  (items: InventoryStatusLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
