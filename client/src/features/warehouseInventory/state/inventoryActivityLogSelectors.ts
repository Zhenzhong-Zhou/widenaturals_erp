import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const EMPTY_ARRAY: never[] = [];

/**
 * Base selector for the inventory activity log slice.
 */
const selectInventoryActivityLogState = (state: RootState) =>
  selectRuntime(state).inventoryActivityLog;

/**
 * Selects the array of activity log records.
 */
export const selectInventoryActivityLogData = createSelector(
  [selectInventoryActivityLogState],
  (state) => state.data ?? EMPTY_ARRAY
);

/**
 * Selects whether the activity log request is currently loading.
 */
export const selectInventoryActivityLogLoading = createSelector(
  [selectInventoryActivityLogState],
  (state) => state.loading
);

/**
 * Selects any error message from the activity log request.
 */
export const selectInventoryActivityLogError = createSelector(
  [selectInventoryActivityLogState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selects the pagination metadata for the activity log.
 */
export const selectInventoryActivityLogPagination = createSelector(
  [selectInventoryActivityLogState],
  (state) => state.pagination
);

/**
 * Selects `true` if the activity log is loaded and empty.
 */
export const selectInventoryActivityLogIsEmpty = createSelector(
  [selectInventoryActivityLogData, selectInventoryActivityLogLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selects the total number of activity log records across all pages.
 */
export const selectInventoryActivityLogTotalRecords = createSelector(
  [selectInventoryActivityLogPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
