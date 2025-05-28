import warehouseInventoryItemSummaryReducer from './warehouseInventoryItemSummarySlice';
import warehouseInventorySummaryDetailReducer from './warehouseInventorySummaryDetailSlice';
import warehouseInventoryReducer from './warehouseInventorySlice';

export const warehouseInventoryReducers = {
  warehouseInventoryItemSummary: warehouseInventoryItemSummaryReducer,
  warehouseInventorySummaryDetail: warehouseInventorySummaryDetailReducer,
  warehouseInventory: warehouseInventoryReducer,
};

// Optionally export selectors, thunks, types
export * from './warehouseInventoryItemSummarySelectors';
export * from './warehouseInventorySummaryDetailSelectors';
export * from './warehouseInventorySelectors';
export * from './warehouseInventoryThunks';
export * from './warehouseInventoryTypes';
