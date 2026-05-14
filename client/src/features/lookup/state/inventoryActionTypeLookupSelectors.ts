import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  InventoryActionTypeLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectInventoryActionTypeLookupState = (state: RootState) =>
  selectRuntime(state).inventoryActionTypeLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectInventoryActionTypeLookupItems = createSelector(
  [selectInventoryActionTypeLookupState],
  (state) => state.data
);

export const selectInventoryActionTypeLookupLoading = createSelector(
  [selectInventoryActionTypeLookupState],
  (state) => state.loading
);

export const selectInventoryActionTypeLookupError = createSelector(
  [selectInventoryActionTypeLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectInventoryActionTypeLookupMeta = createLookupMetaSelector(
  selectInventoryActionTypeLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectInventoryActionTypeLookupOptions = createSelector(
  [selectInventoryActionTypeLookupItems],
  (items: InventoryActionTypeLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
