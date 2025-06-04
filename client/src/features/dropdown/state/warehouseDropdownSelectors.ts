import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { WarehouseDropdownItem } from '@features/dropdown/state/dropdownTypes';

/**
 * Selects the entire warehouse dropdown state slice.
 */
const selectWarehouseDropdownState = (state: RootState) =>
  state.warehouseDropdown;

/**
 * Memoized selector for warehouse dropdown items.
 */
export const selectWarehouseDropdownItems = createSelector(
  [selectWarehouseDropdownState],
  (dropdownState): WarehouseDropdownItem[] => dropdownState.data
);

/**
 * Memoized selector for loading status of the warehouse dropdown.
 */
export const selectWarehouseDropdownLoading = createSelector(
  [selectWarehouseDropdownState],
  (dropdownState): boolean => dropdownState.loading
);

/**
 * Memoized selector for error state of the warehouse dropdown.
 */
export const selectWarehouseDropdownError = createSelector(
  [selectWarehouseDropdownState],
  (dropdownState): string | null => dropdownState.error
);
