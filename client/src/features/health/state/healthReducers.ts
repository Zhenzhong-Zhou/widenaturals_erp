import healthReducer from './healthStatusSlice';

/**
 * Reducer map for the Health feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `health` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for the Health feature.
 */
export const healthReducers = {
  /** Application and system health status */
  health: healthReducer,
};
