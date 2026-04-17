import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const EMPTY_ARRAY: never[] = [];

/**
 * Base selector for the warehouse summary state slice.
 */
const selectWarehouseSummaryState = (state: RootState) =>
  selectRuntime(state).warehouseSummary;

/**
 * Selects the full warehouse summary record.
 */
export const selectWarehouseSummaryData = createSelector(
  [selectWarehouseSummaryState],
  (state) => state.data
);

/**
 * Selects whether the summary request is currently loading.
 */
export const selectWarehouseSummaryLoading = createSelector(
  [selectWarehouseSummaryState],
  (state) => state.loading
);

/**
 * Selects any error message from the summary request.
 */
export const selectWarehouseSummaryError = createSelector(
  [selectWarehouseSummaryState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selects the warehouse info from the summary.
 */
export const selectWarehouseSummaryWarehouseInfo = createSelector(
  [selectWarehouseSummaryData],
  (data) => data?.warehouse ?? null
);

/**
 * Selects the aggregate totals from the summary.
 */
export const selectWarehouseSummaryTotals = createSelector(
  [selectWarehouseSummaryData],
  (data) => data?.totals ?? null
);

/**
 * Selects the batch type breakdown from the summary.
 */
export const selectWarehouseSummaryByBatchType = createSelector(
  [selectWarehouseSummaryData],
  (data) => data?.byBatchType ?? null
);

/**
 * Selects the status breakdown from the summary.
 */
export const selectWarehouseSummaryByStatus = createSelector(
  [selectWarehouseSummaryData],
  (data) => data?.byStatus ?? EMPTY_ARRAY
);
