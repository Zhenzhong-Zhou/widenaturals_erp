import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const selectWarehouseState = (state: RootState) =>
  selectRuntime(state).warehouseDetails;

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
