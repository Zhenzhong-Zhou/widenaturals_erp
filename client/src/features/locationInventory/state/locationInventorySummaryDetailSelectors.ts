import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Root selector to access the location inventory summary by item slice state.
 */
const selectLocationInventorySummaryDetailState= createSelector(
  [selectRuntime],
  (runtime) => runtime.locationInventorySummaryDetail
);

/**
 * Selector to get the inventory summary detail data array.
 */
export const selectLocationInventorySummaryDetailData = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.data
);

/**
 * Selector to get the pagination metadata for location inventory summary detail.
 */
export const selectLocationInventorySummaryDetailPagination = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.pagination
);

/**
 * Selector to get the loading state for the summary detail fetch operation.
 */
export const selectLocationInventorySummaryDetailLoading = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.loading
);

/**
 * Selector to get any error message from the location inventory summary detail fetch.
 */
export const selectLocationInventorySummaryDetailError = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.error
);
