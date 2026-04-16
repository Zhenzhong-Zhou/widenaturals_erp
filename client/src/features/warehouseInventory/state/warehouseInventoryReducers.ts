import paginatedWarehouseInventoryReducer from './paginatedWarehouseInventorySlice';

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
  /** Paginated warehouse inventory list with filters and sorting */
  paginatedWarehouseInventory: paginatedWarehouseInventoryReducer,
};
