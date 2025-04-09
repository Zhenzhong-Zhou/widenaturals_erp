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
export * from './bulkInsertWarehouseInventorySelectors';
export * from './insertedInventoryRecordsResponseSelectors';
export * from './inventoryDropdownSelectors';
export * from './lotAdjustmentDropdownSelectors';
export * from './lotAdjustmentQtySelectors';
export * from './warehouseInventoryDetailSelectors';
export * from './warehouseInventorySelector';
export * from './warehouseInventorySummarySelectors';
export * from './warehouseItemSummarySelectors';
export * from './warehouseInventoryThunks';
export * from './warehouseInventoryTypes';