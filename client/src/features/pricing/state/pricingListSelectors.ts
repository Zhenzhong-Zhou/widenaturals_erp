import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base selector
const selectPricingListState = (state: RootState) => state.pricingList;

/**
 * Selector to get pricing records.
 */
export const selectPricingListData = createSelector(
  [selectPricingListState],
  (state) => state.data
);

/**
 * Selector to get pagination metadata.
 */
export const selectPricingListPagination = createSelector(
  [selectPricingListState],
  (state) => state.pagination
);

/**
 * Selector to get loading status.
 */
export const selectPricingLoading = createSelector(
  [selectPricingListState],
  (state) => state.loading
);

/**
 * Selector to get an error message.
 */
export const selectPricingError = createSelector(
  [selectPricingListState],
  (state) => state.error
);

/**
 * Selector to get total pricing record count.
 */
export const selectPricingTotalCount = createSelector(
  [selectPricingListState],
  (state) => state.pagination.totalRecords
);

/**
 * Selector to compute if there’s no data and not loading (used for UI fallbacks).
 */
export const selectIsPricingListEmpty = createSelector(
  [selectPricingListData, selectPricingLoading],
  (data, loading) => !loading && data.length === 0
);
