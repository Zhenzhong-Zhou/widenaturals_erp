import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type { SupplierLookupItem, LookupOption } from '@features/lookup/state';

// -----------------------------
// Base Selector
// -----------------------------
const selectSupplierLookupState = (state: RootState) =>
  selectRuntime(state).supplierLookup;

// -----------------------------
// Basic Selectors
// -----------------------------
export const selectSupplierLookupItems = createSelector(
  [selectSupplierLookupState],
  (state) => state.data
);

export const selectSupplierLookupLoading = createSelector(
  [selectSupplierLookupState],
  (state) => state.loading
);

export const selectSupplierLookupError = createSelector(
  [selectSupplierLookupState],
  (state): string | null => state.error?.message ?? null
);

// -----------------------------
// Pagination Meta
// -----------------------------
export const selectSupplierLookupMeta = createLookupMetaSelector(
  selectSupplierLookupState
);

// -----------------------------
// Options Mapping
// -----------------------------
export const selectSupplierLookupOptions = createSelector(
  [selectSupplierLookupItems],
  (items: SupplierLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'subLabel'])
);
