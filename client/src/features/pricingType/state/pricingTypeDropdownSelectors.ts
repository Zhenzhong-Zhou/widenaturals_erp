import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Simple selector to access the pricing type dropdown state
const selectPricingTypeDropdownState = (state: RootState) => state.pricingTypeDropdown;

// Memoized selector to get pricing types as dropdown options
export const selectPricingTypeDropdown = createSelector(
  [selectPricingTypeDropdownState],
  (state) => state.pricingTypes
);

// Memoized selector to get loading state
export const selectPricingTypeDropdownLoading = createSelector(
  [selectPricingTypeDropdownState],
  (state) => state.loading
);

// Memoized selector to get error state
export const selectPricingTypeDropdownError = createSelector(
  [selectPricingTypeDropdownState],
  (state) => state.error
);
