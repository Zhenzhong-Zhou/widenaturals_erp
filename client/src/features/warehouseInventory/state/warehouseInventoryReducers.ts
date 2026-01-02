import warehouseInventoryItemSummaryReducer from './warehouseInventoryItemSummarySlice';
import warehouseInventorySummaryDetailReducer from './warehouseInventorySummaryDetailSlice';
import warehouseInventoryReducer from './warehouseInventorySlice';
import warehouseInventoryCreateReducer from './warehouseInventoryCreateSlice';
import warehouseInventoryAdjustReducer from './warehouseInventoryAdjustSlice';

/**
 * Reducer map for the Warehouse Inventory feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `warehouseInventory` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const warehouseInventoryReducers = {
  /** Aggregated item-level inventory summary */
  warehouseInventoryItemSummary: warehouseInventoryItemSummaryReducer,

  /** Detailed inventory summary for a specific SKU / batch */
  warehouseInventorySummaryDetail: warehouseInventorySummaryDetailReducer,

  /** Core warehouse inventory records */
  warehouseInventory: warehouseInventoryReducer,

  /** Warehouse inventory creation workflow */
  createWarehouseInventory: warehouseInventoryCreateReducer,

  /** Inventory adjustment workflow */
  warehouseInventoryAdjust: warehouseInventoryAdjustReducer,
};
