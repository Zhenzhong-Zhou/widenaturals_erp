import warehouseInventoryItemSummaryReducer from './warehouseInventoryItemSummarySlice';
import warehouseInventorySummaryDetailReducer from './warehouseInventorySummaryDetailSlice';
import warehouseInventoryReducer from './warehouseInventorySlice';
import createWarehouseInventoryReducer from './warehouseInventoryCreateSlice';

export const warehouseInventoryReducers = {
  warehouseInventoryItemSummary: warehouseInventoryItemSummaryReducer,
  warehouseInventorySummaryDetail: warehouseInventorySummaryDetailReducer,
  warehouseInventory: warehouseInventoryReducer,
  createWarehouseInventory: createWarehouseInventoryReducer,
};

// Optionally export selectors, thunks, types
export * from './warehouseInventoryItemSummarySelectors';
export * from './warehouseInventorySummaryDetailSelectors';
export * from './warehouseInventorySelectors';
export * from './warehouseInventoryCreateSelectors';
export * from './warehouseInventoryThunks';
export * from './warehouseInventoryTypes';
