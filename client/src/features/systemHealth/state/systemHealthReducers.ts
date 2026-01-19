import systemHealthReducer from './systemHealthSlice';

/**
 * Reducer map for the System Health feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `systemHealth` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for the System Health feature.
 */
export const systemHealthReducers = {
  /** Application and system health status */
  systemHealth: systemHealthReducer,
};
