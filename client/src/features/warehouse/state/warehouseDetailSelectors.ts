import { createSelector } from "@reduxjs/toolkit";
import { RootState } from '../../../store/store.ts';

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
