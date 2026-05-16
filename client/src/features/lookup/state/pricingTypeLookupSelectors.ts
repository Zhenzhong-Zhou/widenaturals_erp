import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  PricingTypeLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectPricingTypeLookupState = (state: RootState) =>
  selectRuntime(state).pricingTypeLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectPricingTypeLookupItems = createSelector(
  [selectPricingTypeLookupState],
  (state) => state.data
);

export const selectPricingTypeLookupLoading = createSelector(
  [selectPricingTypeLookupState],
  (state) => state.loading
);

export const selectPricingTypeLookupError = createSelector(
  [selectPricingTypeLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectPricingTypeLookupMeta = createLookupMetaSelector(
  selectPricingTypeLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectPricingTypeLookupOptions = createSelector(
  [selectPricingTypeLookupItems],
  (items: PricingTypeLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
