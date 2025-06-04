import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base Selector
const selectWarehouseState = (state: RootState) => state.warehouses;

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
