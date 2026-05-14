import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type { LocationLookupItem, LookupOption } from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectLocationLookupState = (state: RootState) =>
  selectRuntime(state).locationLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectLocationLookupItems = createSelector(
  [selectLocationLookupState],
  (state) => state.data
);

export const selectLocationLookupLoading = createSelector(
  [selectLocationLookupState],
  (state) => state.loading
);

export const selectLocationLookupError = createSelector(
  [selectLocationLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectLocationLookupMeta = createLookupMetaSelector(
  selectLocationLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectLocationLookupOptions = createSelector(
  [selectLocationLookupItems],
  (items: LocationLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
