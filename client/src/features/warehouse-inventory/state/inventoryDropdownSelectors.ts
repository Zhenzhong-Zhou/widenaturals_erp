import { createSelector } from 'reselect';
import { RootState } from '@store/store';

// Base selector: Directly selects dropdown state
const selectDropdownState = (state: RootState) => state.inventoryDropdown;

/**
 * Selects the product dropdown list (ensures an array is returned).
 * Memoized to prevent unnecessary re-renders.
 */
export const selectProductDropdown = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.products || []
);

/**
 * Selects the warehouse dropdown list (ensures an array is returned).
 * Memoized to prevent unnecessary re-renders.
 */
export const selectWarehouseDropdown = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.warehouses || []
);

/**
 * Selects the loading state, used to check when either warehouses or products are being fetched.
 */
export const selectDropdownLoading = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.loading
);

/**
 * Selects any error messages related to warehouse or product dropdowns.
 * Ensures `error` is either a string or `null`.
 */
export const selectDropdownError = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.error ?? null
);

/**
 * Selects both products and warehouses together as a single object.
 * Useful if you need both dropdowns in one component.
 */
export const selectDropdownData = createSelector(
  [selectProductDropdown, selectWarehouseDropdown],
  (products, warehouses) => ({ products, warehouses })
);
