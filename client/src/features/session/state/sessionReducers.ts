import sessionReducer from './sessionSlice';

/**
 * Reducer map for the Session feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `session` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const sessionReducers = {
  /** Authenticated session state (tokens, expiry, metadata) */
  session: sessionReducer,
};
