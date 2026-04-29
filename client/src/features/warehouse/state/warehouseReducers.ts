import paginatedWarehouseReducer from './paginatedWarehouseSlice';
import warehouseDetailReducer    from './warehouseDetailSlice';

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
  /** Paginated warehouse list with inventory summary stats. */
  paginatedWarehouses: paginatedWarehouseReducer,
  
  /** Single warehouse detail view. */
  warehouseDetail: warehouseDetailReducer,
};
