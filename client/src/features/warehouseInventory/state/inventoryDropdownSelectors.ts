import { createSelector } from 'reselect';
import type { RootState } from '@store/store';

/**
 * Base selector for inventory dropdown state.
 */
const selectDropdownState = (state: RootState) => state.inventoryDropdown;

/**
 * Selects the product dropdown list.
 */
export const selectProductDropdown = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.products || []
);

/**
 * Selects the warehouse dropdown list.
 */
export const selectWarehouseDropdown = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.warehouses || []
);

/**
 * Selects only the product loading state.
 */
export const selectProductDropdownLoading = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.loading?.products ?? false
);

/**
 * Selects only the warehouse loading state.
 */
export const selectWarehouseDropdownLoading = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.loading?.warehouses ?? false
);

/**
 * Selects only the product dropdown error.
 */
export const selectProductDropdownError = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.error?.products ?? null
);

/**
 * Selects only the warehouse dropdown error.
 */
export const selectWarehouseDropdownError = createSelector(
  [selectDropdownState],
  (dropdown) => dropdown.error?.warehouses ?? null
);

/**
 * Selects both dropdown lists together.
 */
export const selectDropdownData = createSelector(
  [selectProductDropdown, selectWarehouseDropdown],
  (products, warehouses) => ({ products, warehouses })
);
