import warehouseReducer from './warehouseSlice';
import warehouseDetailReducer from './warehouseDetailSlice';

/**
 * Reducer map for the Warehouse feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `warehouse` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const warehouseReducers = {
  /** Warehouse list and core warehouse data */
  warehouses: warehouseReducer,

  /** Single warehouse detail view */
  warehouseDetails: warehouseDetailReducer,
};
