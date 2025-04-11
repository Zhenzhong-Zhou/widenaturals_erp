import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base selectors
const selectWarehouseInventoryDetailState = (state: RootState) =>
  state.warehouseInventoryDetails;

export const selectWarehouseInventoryDetails = createSelector(
  selectWarehouseInventoryDetailState,
  (inventoryState) => inventoryState.inventoryDetails
);

export const selectWarehouseInventoryDetailPagination = createSelector(
  selectWarehouseInventoryDetailState,
  (inventoryState) => inventoryState.pagination
);

export const selectWarehouseInventoryDetailLoading = createSelector(
  selectWarehouseInventoryDetailState,
  (inventoryState) => inventoryState.loading
);

export const selectWarehouseInventoryDetailError = createSelector(
  selectWarehouseInventoryDetailState,
  (inventoryState) => inventoryState.error
);
