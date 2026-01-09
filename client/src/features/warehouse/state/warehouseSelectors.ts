import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

// Base Selector
const selectWarehouseState = createSelector(
  [selectRuntime],
  (runtime) => runtime.warehouses
);

// Memoized Selectors
export const selectWarehouses = createSelector(
  selectWarehouseState,
  (warehouseState) => warehouseState.warehouses
);
export const selectWarehousePagination = createSelector(
  selectWarehouseState,
  (warehouseState) => warehouseState.pagination
);
export const selectWarehouseLoading = createSelector(
  selectWarehouseState,
  (warehouseState) => warehouseState.loading
);
export const selectWarehouseError = createSelector(
  selectWarehouseState,
  (warehouseState) => warehouseState.error
);
