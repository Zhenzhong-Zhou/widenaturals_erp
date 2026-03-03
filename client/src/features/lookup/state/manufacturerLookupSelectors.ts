import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  ManufacturerLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectManufacturerLookupState = (state: RootState) =>
  selectRuntime(state).manufacturerLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectManufacturerLookupItems = createSelector(
  [selectManufacturerLookupState],
  (state) => state.data
);

export const selectManufacturerLookupLoading = createSelector(
  [selectManufacturerLookupState],
  (state) => state.loading
);

export const selectManufacturerLookupError = createSelector(
  [selectManufacturerLookupState],
  (state): string | null =>
    state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectManufacturerLookupMeta = createLookupMetaSelector(
  selectManufacturerLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectManufacturerLookupOptions = createSelector(
  [selectManufacturerLookupItems],
  (items: ManufacturerLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
