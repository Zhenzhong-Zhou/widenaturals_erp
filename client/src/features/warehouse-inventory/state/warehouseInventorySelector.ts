import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';

/** Select raw warehouse inventory state */
export const selectWarehouseInventoryState = (state: RootState) =>
  state.warehouseInventories;

/** Select warehouse inventories */
export const selectWarehouseInventories = createSelector(
  selectWarehouseInventoryState,
  (inventoryState) => inventoryState.inventories
);

/** Select pagination data */
export const selectWarehouseInventoryPagination = createSelector(
  selectWarehouseInventoryState,
  (inventoryState) => inventoryState.pagination
);

/** Select loading state */
export const selectWarehouseInventoryLoading = createSelector(
  selectWarehouseInventoryState,
  (inventoryState) => inventoryState.loading
);

/** Select error state */
export const selectWarehouseInventoryError = createSelector(
  selectWarehouseInventoryState,
  (inventoryState) => inventoryState.error
);
