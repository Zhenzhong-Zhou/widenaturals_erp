import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  WarehouseTypeLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectWarehouseTypeLookupState = (state: RootState) =>
  selectRuntime(state).warehouseTypeLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectWarehouseTypeLookupItems = createSelector(
  [selectWarehouseTypeLookupState],
  (state) => state.data
);

export const selectWarehouseTypeLookupLoading = createSelector(
  [selectWarehouseTypeLookupState],
  (state) => state.loading
);

export const selectWarehouseTypeLookupError = createSelector(
  [selectWarehouseTypeLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectWarehouseTypeLookupMeta = createLookupMetaSelector(
  selectWarehouseTypeLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectWarehouseTypeLookupOptions = createSelector(
  [selectWarehouseTypeLookupItems],
  (items: WarehouseTypeLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
