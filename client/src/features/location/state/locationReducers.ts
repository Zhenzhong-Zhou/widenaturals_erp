import locationReducer from './locationSlice';

/**
 * Reducer map for the Location feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `location` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for the Location feature.
 */
export const locationReducers = {
  /** Location list and related metadata */
  locations: locationReducer,
};
