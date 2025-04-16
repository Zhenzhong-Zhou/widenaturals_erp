import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { WarehouseItemSummaryState } from '@features/warehouseInventory/state/warehouseItemSummarySlice';

/**
 * Base selector to access the warehouse item summary state.
 */
const selectWarehouseItemState = (
  state: RootState
): WarehouseItemSummaryState =>
  state.warehouseItems as WarehouseItemSummaryState;

/**
 * Selector to get the loading status.
 */
export const selectWarehouseItemLoading = createSelector(
  selectWarehouseItemState,
  (state) => state.loading
);

/**
 * Selector to get the error message.
 */
export const selectWarehouseItemError = createSelector(
  selectWarehouseItemState,
  (state) => state.error
);

/**
 * Selector to get pagination info.
 */
export const selectWarehouseItemPagination = createSelector(
  selectWarehouseItemState,
  (state) => state.pagination
);

/**
 * Selector to get the item summary data.
 */
export const selectWarehouseItemSummary = createSelector(
  selectWarehouseItemState,
  (state) => state.itemSummaryData
);
