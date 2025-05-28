import { RootState } from '@store/store';

export const selectWarehouseInventoryData = (state: RootState) => state.warehouseInventory.data;
export const selectWarehouseInventoryLoading = (state: RootState) => state.warehouseInventory.loading;
export const selectWarehouseInventoryError = (state: RootState) => state.warehouseInventory.error;
export const selectWarehouseInventoryPagination = (state: RootState) => state.warehouseInventory.pagination;
