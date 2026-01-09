import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

const selectWarehouseState = createSelector(
  [selectRuntime],
  (runtime) => runtime.warehouseDetails
);

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
