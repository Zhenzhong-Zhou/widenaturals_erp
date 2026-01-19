import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the location inventory summary state slice.
 *
 * Responsibilities:
 * - Extract the location inventory summary state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectLocationInventorySummaryState = (state: RootState) =>
  selectRuntime(state).locationInventorySummary;

/**
 * Selects the inventory summary data array.
 *
 * Includes inventory entries (products or materials) with associated metadata.
 */
export const selectLocationInventorySummaryData = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.data
);

/**
 * Selects pagination metadata for the inventory summary view.
 */
export const selectLocationInventorySummaryPagination = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.pagination
);

/**
 * Selects whether the inventory summary request is currently loading.
 */
export const selectLocationInventorySummaryLoading = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.loading
);

/**
 * Selects any error message from the inventory summary request.
 */
export const selectLocationInventorySummaryError = createSelector(
  [selectLocationInventorySummaryState],
  (slice) => slice.error
);
