import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

const selectWarehouseState = (state: RootState) => state.warehouseDetails;

export const selectWarehouseDetails = createSelector(
  [selectWarehouseState],
  (warehouseState) => warehouseState.warehouseDetails
);

export const selectWarehouseDetailsLoading = createSelector(
  [selectWarehouseState],
  (warehouseState) => warehouseState.loading
);

export const selectWarehouseDetailsError = createSelector(
  [selectWarehouseState],
  (warehouseState) => warehouseState.error
);
