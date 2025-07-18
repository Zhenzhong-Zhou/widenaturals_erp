import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the pricingListByType slice from the root state.
 */
const selectPricingListByTypeState = (state: RootState) =>
  state.pricingListByType;

/**
 * Selector to retrieve the list of pricing detail records.
 */
export const selectPricingListByType = createSelector(
  [selectPricingListByTypeState],
  (state) => state.data
);

/**
 * Selector to retrieve pagination metadata for the pricing list.
 */
export const selectPricingListByTypePagination = createSelector(
  [selectPricingListByTypeState],
  (state) => state.pagination
);

/**
 * Selector to retrieve the loading state for the pricing list request.
 */
export const selectPricingListByTypeLoading = createSelector(
  [selectPricingListByTypeState],
  (state) => state.loading
);

/**
 * Selector to retrieve the error message for the pricing list request.
 */
export const selectPricingListByTypeError = createSelector(
  [selectPricingListByTypeState],
  (state) => state.error
);
