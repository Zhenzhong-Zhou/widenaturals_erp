import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  LocationTypeLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectLocationTypeLookupState = (state: RootState) =>
  selectRuntime(state).locationTypeLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectLocationTypeLookupItems = createSelector(
  [selectLocationTypeLookupState],
  (state) => state.data
);

export const selectLocationTypeLookupLoading = createSelector(
  [selectLocationTypeLookupState],
  (state) => state.loading
);

export const selectLocationTypeLookupError = createSelector(
  [selectLocationTypeLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectLocationTypeLookupMeta = createLookupMetaSelector(
  selectLocationTypeLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectLocationTypeLookupOptions = createSelector(
  [selectLocationTypeLookupItems],
  (items: LocationTypeLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
