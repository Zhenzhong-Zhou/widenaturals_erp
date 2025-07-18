import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { LotAdjustmentTypeLookupItem } from './lookupTypes.ts';

/**
 * Root selector to access the lot adjustment type lookup state slice.
 *
 * @param state - The root Redux store state.
 * @returns The lot adjustment type lookup state.
 */
const selectLotAdjustmentTypeLookupState = (state: RootState) =>
  state.lotAdjustmentTypeLookup;

/**
 * Selector to retrieve the list of lot adjustment type lookup items.
 *
 * @returns Array of lot adjustment lookup options.
 */
export const selectLotAdjustmentTypeItems = createSelector(
  [selectLotAdjustmentTypeLookupState],
  (lookupState): LotAdjustmentTypeLookupItem[] => lookupState.data
);

/**
 * Selector to retrieve the loading status of the lot adjustment lookup.
 *
 * @returns `true` if loading, otherwise `false`.
 */
export const selectLotAdjustmentTypeLoading = createSelector(
  [selectLotAdjustmentTypeLookupState],
  (lookupState): boolean => lookupState.loading
);

/**
 * Selector to retrieve any error message from the lot adjustment lookup state.
 *
 * @returns The error message string, or `null` if no error.
 */
export const selectLotAdjustmentTypeError = createSelector(
  [selectLotAdjustmentTypeLookupState],
  (lookupState): string | null => lookupState.error
);
