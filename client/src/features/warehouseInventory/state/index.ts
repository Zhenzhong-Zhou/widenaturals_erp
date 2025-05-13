import warehouseInventoryItemSummaryReducer from './warehouseInventoryItemSummarySlice.ts';
import warehouseInventorySummaryReducer from './warehouseInventorySummarySlice';
import warehouseInventoriesReducer from './warehouseInventorySlice';
import warehouseItemsReducer from './warehouseItemSummarySlice';
import warehouseInventoryDetailsReducer from './warehouseInventoryDetailSlice';
import lotAdjustmentDropdownReducer from './lotAdjustmentDropdownSlice';
import lotAdjustmentQtyReducer from './lotAdjustmentQtySlice';
import inventoryDropdownReducer from './inventoryDropdownSlice';
import bulkInsertWarehouseInventoryReducer from './bulkInsertWarehouseInventorySlice';
import insertedInventoryRecordsResponseReducer from './insertedInventoryRecordsResponseSlice';

export const warehouseInventoryReducers = {
  warehouseInventoryItemSummary: warehouseInventoryItemSummaryReducer,
  warehouseInventoriesSummary: warehouseInventorySummaryReducer,
  warehouseInventories: warehouseInventoriesReducer,
  warehouseItems: warehouseItemsReducer,
  warehouseInventoryDetails: warehouseInventoryDetailsReducer,
  lotAdjustmentsDropdown: lotAdjustmentDropdownReducer,
  lotAdjustmentQty: lotAdjustmentQtyReducer,
  inventoryDropdown: inventoryDropdownReducer,
  bulkInsertWarehouseInventory: bulkInsertWarehouseInventoryReducer,
  insertedInventoryRecordsResponse: insertedInventoryRecordsResponseReducer,
};

// Optionally export selectors, thunks, types
export * from './warehouseInventorySkuSummarySelectors';
export * from './bulkInsertWarehouseInventorySelectors';
export * from './insertedInventoryRecordsResponseSelectors';
export * from './inventoryDropdownSelectors';
export * from './lotAdjustmentDropdownSelectors';
export * from './lotAdjustmentQtySelectors';
export * from './warehouseInventoryDetailSelectors';
export * from './warehouseInventorySelector.ts';
export * from './warehouseInventorySummarySelectors';
export * from './warehouseItemSummarySelectors';
export * from './warehouseInventoryThunks';
export * from './warehouseInventoryTypes';
