import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { PriceState } from '@features/pricing';

// Select the pricing state from the root state
const selectValuePriceState = (state: RootState) => state.pricingValue;

// Selector for fetching price data
export const selectPriceValueData = createSelector(
  [selectValuePriceState],
  (priceState: PriceState) => priceState.priceData
);

// Selector for fetching loading status
export const selectPriceValueLoading = createSelector(
  [selectValuePriceState],
  (priceState: PriceState) => priceState.loading
);

// Selector for fetching error status
export const selectPriceValueError = createSelector(
  [selectValuePriceState],
  (priceState: PriceState) => priceState.error
);
