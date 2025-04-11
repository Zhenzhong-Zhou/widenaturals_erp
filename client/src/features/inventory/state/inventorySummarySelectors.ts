import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

const selectInventorySummaryState = (state: RootState) =>
  state.inventorySummary;

export const selectInventorySummaryData = createSelector(
  [selectInventorySummaryState],
  (summary) => summary.data
);

export const selectInventorySummaryPagination = createSelector(
  [selectInventorySummaryState],
  (summary) => summary.pagination
);

export const selectInventorySummaryLoading = createSelector(
  [selectInventorySummaryState],
  (summary) => summary.loading
);

export const selectInventorySummaryError = createSelector(
  [selectInventorySummaryState],
  (summary) => summary.error
);
