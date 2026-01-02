import locationInventoryKpiSummaryReducer from './locationInventoryKpiSummarySlice';
import locationInventorySummaryReducer from './locationInventorySummarySlice';
import locationInventorySummaryDetailReducer from './locationInventorySummaryDetailSlice';
import locationInventoryReducer from './locationInventorySlice';

/**
 * Reducer map for the Location Inventory feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `locationInventory` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for location-level inventory data.
 */
export const locationInventoryReducers = {
  /** KPI-level inventory summary per location */
  locationInventoryKpiSummary: locationInventoryKpiSummaryReducer,

  /** Aggregated inventory summary per location */
  locationInventorySummary: locationInventorySummaryReducer,

  /** Detailed inventory breakdown for a specific location */
  locationInventorySummaryDetail: locationInventorySummaryDetailReducer,

  /** Core location inventory records */
  locationInventory: locationInventoryReducer,
};
