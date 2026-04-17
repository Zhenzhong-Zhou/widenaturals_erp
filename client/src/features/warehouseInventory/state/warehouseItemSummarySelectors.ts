import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the warehouse item summary state slice.
 */
const selectWarehouseItemSummaryState = (state: RootState) =>
  selectRuntime(state).warehouseItemSummary;

/**
 * Selects the full item summary record.
 */
export const selectWarehouseItemSummaryData = createSelector(
  [selectWarehouseItemSummaryState],
  (state) => state.data
);

/**
 * Selects whether the item summary request is currently loading.
 */
export const selectWarehouseItemSummaryLoading = createSelector(
  [selectWarehouseItemSummaryState],
  (state) => state.loading
);

/**
 * Selects any error message from the item summary request.
 */
export const selectWarehouseItemSummaryError = createSelector(
  [selectWarehouseItemSummaryState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selects the product summaries from the item summary.
 */
export const selectWarehouseItemSummaryProducts = createSelector(
  [selectWarehouseItemSummaryData],
  (data) => data?.products ?? []
);

/**
 * Selects the packaging material summaries from the item summary.
 */
export const selectWarehouseItemSummaryPackaging = createSelector(
  [selectWarehouseItemSummaryData],
  (data) => data?.packagingMaterials ?? []
);

/**
 * Selects whether the item summary is loaded and both arrays are empty.
 */
export const selectWarehouseItemSummaryIsEmpty = createSelector(
  [selectWarehouseItemSummaryData, selectWarehouseItemSummaryLoading],
  (data, loading) =>
    !loading &&
    (data?.products?.length ?? 0) === 0 &&
    (data?.packagingMaterials?.length ?? 0) === 0
);
