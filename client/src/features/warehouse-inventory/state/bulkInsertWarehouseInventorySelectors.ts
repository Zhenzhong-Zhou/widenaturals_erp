import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store.ts';

// Base selector to get the entire warehouse inventory state
const selectWarehouseInventoryInsertState = (state: RootState) =>
  state.bulkInsertWarehouseInventory;

// Select data
export const selectWarehouseInventoryInsertData = createSelector(
  [selectWarehouseInventoryInsertState],
  (warehouseInventory) => warehouseInventory.data
);

// Select loading state
export const selectWarehouseInventoryInsertLoading = createSelector(
  [selectWarehouseInventoryInsertState],
  (warehouseInventory) => warehouseInventory.loading
);

// Select error state
export const selectWarehouseInventoryInsertError = createSelector(
  [selectWarehouseInventoryInsertState],
  (warehouseInventory) => warehouseInventory.error
);
