import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  LotAdjustmentTypeLookupItem,
  LookupOption,
} from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectLotAdjustmentTypeLookupState = (state: RootState) =>
  selectRuntime(state).lotAdjustmentTypeLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectLotAdjustmentTypeLookupItems = createSelector(
  [selectLotAdjustmentTypeLookupState],
  (state) => state.data
);

export const selectLotAdjustmentTypeLookupLoading = createSelector(
  [selectLotAdjustmentTypeLookupState],
  (state) => state.loading
);

export const selectLotAdjustmentTypeLookupError = createSelector(
  [selectLotAdjustmentTypeLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectLotAdjustmentTypeLookupMeta = createLookupMetaSelector(
  selectLotAdjustmentTypeLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectLotAdjustmentTypeLookupOptions = createSelector(
  [selectLotAdjustmentTypeLookupItems],
  (items: LotAdjustmentTypeLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
