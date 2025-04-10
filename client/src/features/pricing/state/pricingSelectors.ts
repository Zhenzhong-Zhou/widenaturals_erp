import { RootState } from '@store/store';
import { createSelector } from '@reduxjs/toolkit';
import { PricingListState } from '@features/pricing/state/pricingSlice';

const selectPricingsState = (state: RootState): PricingListState =>
  state.pricings as PricingListState;

/**
 * Selects pricing list from Redux state.
 */
export const selectPricingList = createSelector(
  selectPricingsState,
  (state) => state.data
);

/**
 * Selects pagination details.
 */
export const selectPagination = createSelector(
  selectPricingsState,
  (state) => state.pagination
);

/**
 * Selects loading state.
 */
export const selectPricingLoading = createSelector(
  selectPricingsState,
  (state) => state.loading
);

/**
 * Selects error message.
 */
export const selectPricingError = createSelector(
  selectPricingsState,
  (state) => state.error
);