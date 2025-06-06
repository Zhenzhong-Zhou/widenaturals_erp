import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { LotAdjustmentTypeDropdownItem } from './dropdownTypes';

/**
 * Root selector to access the lot adjustment type dropdown state slice.
 *
 * @param state - The root Redux store state.
 * @returns The lot adjustment type dropdown state.
 */
const selectLotAdjustmentTypeDropdownState = (state: RootState) => state.lotAdjustmentTypeDropdown;

/**
 * Selector to retrieve the list of lot adjustment type dropdown items.
 *
 * @returns Array of lot adjustment dropdown options.
 */
export const selectLotAdjustmentTypeItems = createSelector(
  [selectLotAdjustmentTypeDropdownState],
  (dropdownState): LotAdjustmentTypeDropdownItem[] => dropdownState.data
);

/**
 * Selector to retrieve the loading status of the lot adjustment dropdown.
 *
 * @returns `true` if loading, otherwise `false`.
 */
export const selectLotAdjustmentTypeLoading = createSelector(
  [selectLotAdjustmentTypeDropdownState],
  (dropdownState): boolean => dropdownState.loading
);

/**
 * Selector to retrieve any error message from the lot adjustment dropdown state.
 *
 * @returns The error message string, or `null` if no error.
 */
export const selectLotAdjustmentTypeError = createSelector(
  [selectLotAdjustmentTypeDropdownState],
  (dropdownState): string | null => dropdownState.error
);
