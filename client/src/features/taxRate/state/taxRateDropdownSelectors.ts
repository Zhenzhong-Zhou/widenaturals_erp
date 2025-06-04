import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Simple selector to get the tax rate state
const selectTaxRateDropdownState = (state: RootState) => state.taxRateDropdown;

// Selector to get tax rates as dropdown options
export const selectTaxRateDropdown = createSelector(
  [selectTaxRateDropdownState],
  (taxRateState) => taxRateState.taxRates
);

// Selector to get loading state
export const selectTaxRateDropdownLoading = createSelector(
  [selectTaxRateDropdownState],
  (taxRateState) => taxRateState.loading
);

// Selector to get error state
export const selectTaxRateDropdownError = createSelector(
  [selectTaxRateDropdownState],
  (taxRateState) => taxRateState.error
);
