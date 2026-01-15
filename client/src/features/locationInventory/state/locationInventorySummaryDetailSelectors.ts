import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the location inventory summary detail state slice.
 *
 * Responsibilities:
 * - Extract the location inventory summary detail state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectLocationInventorySummaryDetailState = (state: RootState) =>
  selectRuntime(state).locationInventorySummaryDetail;

/**
 * Selects the inventory summary detail data array.
 */
export const selectLocationInventorySummaryDetailData = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.data
);

/**
 * Selects pagination metadata for the location inventory summary detail view.
 */
export const selectLocationInventorySummaryDetailPagination = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.pagination
);

/**
 * Selects whether the inventory summary detail request is currently loading.
 */
export const selectLocationInventorySummaryDetailLoading = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.loading
);

/**
 * Selects any error message from the inventory summary detail request.
 */
export const selectLocationInventorySummaryDetailError = createSelector(
  [selectLocationInventorySummaryDetailState],
  (state) => state.error
);
