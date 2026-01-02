import inventoryActivityLogsReducer from './inventoryActivityLogsSlice';

/**
 * Reducer map for the Report feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `report` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const reportReducers = {
  /** Inventory activity and audit log reporting */
  inventoryActivityLogs: inventoryActivityLogsReducer,
};
