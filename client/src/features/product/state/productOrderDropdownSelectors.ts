import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Simple selector to access the product order dropdown state
const selectProductOrderDropdownState = (state: RootState) => state.productOrderDropdown;

// Selector to get product items
export const selectProductOrderDropdown = createSelector(
  [selectProductOrderDropdownState],
  (productOrderState) => productOrderState.products
);

// Selector to get loading state
export const selectProductOrderDropdownLoading = createSelector(
  [selectProductOrderDropdownState],
  (productOrderState) => productOrderState.loading
);

// Selector to get error state
export const selectProductOrderDropdownError = createSelector(
  [selectProductOrderDropdownState],
  (productOrderState) => productOrderState.error
);
