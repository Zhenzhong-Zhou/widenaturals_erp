import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { DiscountDropdownItem } from '@features/discount';

// Simple selector to access the discountDropdown state
const selectDiscountDropdownState = (state: RootState) =>
  state.discountDropdown;

// Memoized Selector for getting discounts
export const selectDiscounts = createSelector(
  [selectDiscountDropdownState],
  (discountDropdown) => discountDropdown.discounts
);

// Memoized Selector for loading state
export const selectDiscountsLoading = createSelector(
  [selectDiscountDropdownState],
  (discountDropdown) => discountDropdown.loading
);

// Memoized Selector for error state
export const selectDiscountsError = createSelector(
  [selectDiscountDropdownState],
  (discountDropdown) => discountDropdown.error
);

// Enhanced Selector to format discounts for dropdown usage
export const selectFormattedDiscounts = createSelector(
  [selectDiscounts],
  (discounts: DiscountDropdownItem[]) =>
    discounts.map((discount) => ({
      value: discount.id,
      label: `${discount.name} - ${discount.displayValue}`,
    }))
);
