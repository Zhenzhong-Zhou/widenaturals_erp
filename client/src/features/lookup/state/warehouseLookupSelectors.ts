import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { WarehouseLookupItem } from '@features/lookup/state/lookupTypes.ts';

/**
 * Selects the entire warehouse lookup state slice.
 */
const selectWarehouseLookupState = (state: RootState) =>
  state.warehouseLookup;

/**
 * Memoized selector for warehouse lookup items.
 */
export const selectWarehouseLookupItems = createSelector(
  [selectWarehouseLookupState],
  (lookupState): WarehouseLookupItem[] => lookupState.data
);

/**
 * Memoized selector for loading status of the warehouse lookup.
 */
export const selectWarehouseLookupLoading = createSelector(
  [selectWarehouseLookupState],
  (lookupState): boolean => lookupState.loading
);

/**
 * Memoized selector for error state of the warehouse lookup.
 */
export const selectWarehouseLookupError = createSelector(
  [selectWarehouseLookupState],
  (lookupState): string | null => lookupState.error
);
