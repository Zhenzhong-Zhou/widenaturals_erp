import paginatedWarehouseInventoryReducer from './paginatedWarehouseInventorySlice';
import warehouseInventoryCreateReducer from './warehouseInventoryCreateSlice';
import warehouseInventoryAdjustQuantityReducer from './warehouseInventoryAdjustQuantitySlice';
import warehouseInventoryUpdateStatusReducer from './warehouseInventoryUpdateStatusSlice';
import warehouseInventoryUpdateMetadataReducer from './warehouseInventoryUpdateMetadataSlice';
import warehouseInventoryOutboundReducer from './warehouseInventoryOutboundSlice';
import warehouseInventoryDetailReducer from './warehouseInventoryDetailSlice';
import inventoryActivityLogReducer from './inventoryActivityLogSlice';

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
  /** Paginated warehouse inventory list with filters and sorting. */
  paginatedWarehouseInventory: paginatedWarehouseInventoryReducer,
  /** Warehouse inventory bulk creation mutation state. */
  warehouseInventoryCreate: warehouseInventoryCreateReducer,
  /** Warehouse inventory bulk quantity adjustment mutation state. */
  warehouseInventoryAdjustQuantity: warehouseInventoryAdjustQuantityReducer,
  /** Warehouse inventory bulk status update mutation state. */
  warehouseInventoryUpdateStatus: warehouseInventoryUpdateStatusReducer,
  /** Warehouse inventory single record metadata update mutation state. */
  warehouseInventoryUpdateMetadata: warehouseInventoryUpdateMetadataReducer,
  /** Warehouse inventory bulk outbound recording mutation state. */
  warehouseInventoryOutbound: warehouseInventoryOutboundReducer,
  /** Warehouse inventory single record detail view. */
  warehouseInventoryDetail: warehouseInventoryDetailReducer,
  /** Paginated inventory activity log with filters and sorting. */
  inventoryActivityLog: inventoryActivityLogReducer,
};
