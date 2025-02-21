import { createSelector } from 'reselect';
import { RootState } from '../../../store/store.ts';

// Base selector: Directly selects dropdown state
const selectDropdownState = (state: RootState) => state.inventoryDropdown;

// Memoized selector for product dropdown
export const selectProductDropdown = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.products
);

// Memoized selector for warehouse dropdown
export const selectWarehouseDropdown = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.warehouses
);

// Memoized selector for dropdown loading state
export const selectDropdownLoading = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.loading
);
