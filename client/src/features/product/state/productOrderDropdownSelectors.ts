import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store.ts';
import { ProductOrderDropdownState } from '@features/product/state/productOrderDropdownSlice.ts';

/**
 * Base selector to access the productOrderDropdown slice of the Redux state.
 *
 * @param state - The root Redux state.
 * @returns The product order dropdown slice state.
 */
const selectProductOrderDropdownState = (state: RootState): ProductOrderDropdownState =>
  state.productOrderDropdown as ProductOrderDropdownState;

/**
 * Selector to get the list of products available for the product order dropdown.
 */
export const selectProductOrderDropdown = createSelector(
  selectProductOrderDropdownState,
  (state) => state.products
);

/**
 * Selector to get the loading status of the product order dropdown.
 */
export const selectProductOrderDropdownLoading = createSelector(
  selectProductOrderDropdownState,
  (state) => state.loading
);

/**
 * Selector to get the error message (if any) related to the product order dropdown.
 */
export const selectProductOrderDropdownError = createSelector(
  selectProductOrderDropdownState,
  (state) => state.error
);
