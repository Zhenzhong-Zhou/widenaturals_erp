import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Root selector for the locationInventorySummary slice of the Redux state.
 */
const selectLocationInventorySummaryState = (state: RootState) =>
  state.locationInventorySummary;

/**
 * Selects the summary data array from the locationInventorySummary slice.
 * This includes inventory entries (products or materials) with metadata.
 */
export const selectLocationInventorySummaryData = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.data
);

/**
 * Selects the pagination metadata from the locationInventorySummary slice.
 */
export const selectLocationInventorySummaryPagination = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.pagination
);

/**
 * Selects the loading state for the inventory summary fetch operation.
 */
export const selectLocationInventorySummaryLoading = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.loading
);

/**
 * Selects the error message (if any) from the inventory summary fetch operation.
 */
export const selectLocationInventorySummaryError = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.error
);
